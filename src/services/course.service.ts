import { AppDataSource } from "../data-source";
import { CreateCourseDTO, UpdateCourseDTO, CourseResponseDTO, ReviewCourseDTO } from "../dtos/course.dto";
import { Course } from "../entities/Course";
import { User } from "../entities/User";
import { CourseStatus } from "../enums";
import { NotFoundException, InternalServerErrorException, ForbiddenException, BadRequestException } from "../exceptions/HttpException";
import { IsNull, In } from "typeorm";
import { NotificationService } from "./notification.service";
import { NotificationType, AssigneeType } from "../enums";
import { TaskAssignment } from "../entities/TaskAssignment";
import { TaskSubmission } from "../entities/TaskSubmission";

export class CourseService {
  private courseRepository = AppDataSource.getRepository(Course);
  private userRepository = AppDataSource.getRepository(User);
  private assignmentRepository = AppDataSource.getRepository(TaskAssignment);
  private submissionRepository = AppDataSource.getRepository(TaskSubmission);
  private notificationService = new NotificationService();

  async createCourse(creatorId: string, dto: CreateCourseDTO): Promise<CourseResponseDTO> {
    const creator = await this.userRepository.findOne({ where: { id: creatorId } });
    if (!creator) {
      throw new NotFoundException(`User with ID '${creatorId}' not found`);
    }

    const course = this.courseRepository.create({
      creatorId,
      title: dto.title,
      description: dto.description,
      level: dto.level,
      category: dto.category,
      duration: dto.duration,
      color: dto.color,
      icon: dto.icon,
      skills: dto.skills,
      price: dto.price,
      isFree: dto.isFree,
      isFeatured: dto.isFeatured,
      curriculum: dto.curriculum,
      status: CourseStatus.DRAFT,
    });

    const saved = await this.courseRepository.save(course);
    return this.mapToResponseDTO(saved);
  }

  async getCourseById(id: string, userId?: string): Promise<CourseResponseDTO> {
    const course = await this.courseRepository.findOne({ 
      where: { id, deletedAt: IsNull() },
      relations: ["enrolledStudents", "tasks"]
    });
    if (!course) {
      throw new NotFoundException(`Course with ID '${id}' not found`);
    }
    const isEnrolled = userId ? course.enrolledStudents?.some(u => u.id === userId) : false;
    let progress = 0;
    const lessonCount = (course.tasks && course.tasks.length > 0) ? course.tasks.length : (course.lessonCount || 0);

    if (isEnrolled && lessonCount > 0 && userId) {
      const userSubmissions = await this.submissionRepository.find({
        where: { learnerId: userId },
        relations: ["assignment"]
      });
      let completedCount = 0;
      if (course.tasks && course.tasks.length > 0) {
        course.tasks.forEach(task => {
          if (userSubmissions.some(s => s.assignment?.taskId === task.id && (s.status === "SUBMITTED" || s.status === "GRADED"))) {
            completedCount++;
          }
        });
      }
      progress = Math.round((completedCount / lessonCount) * 100);
    }

    return { ...this.mapToResponseDTO(course), isEnrolled, lessonCount, progress };
  }

  async getAllCourses(isStudent: boolean, teacherId?: string, status?: CourseStatus, userId?: string): Promise<CourseResponseDTO[]> {
    const query = this.courseRepository.createQueryBuilder("course")
      .where("course.deletedAt IS NULL");

    if (isStudent) {
      query.andWhere("course.status = :status", { status: CourseStatus.PUBLISHED });
    } else {
      if (teacherId) {
        query.andWhere("course.creatorId = :teacherId", { teacherId });
      }
      if (status) {
        query.andWhere("course.status = :status", { status });
      }
    }

    const courses = await query.getMany();
    
    if (courses.length === 0) return [];

    // We need to fetch enrolledStudents to check enrollment, or we can just fetch it with relations above.
    // For simplicity, let's re-fetch with relations or add leftJoinAndSelect.
    const coursesWithRelations = await this.courseRepository.find({
      where: { id: In(courses.map(c => c.id)) },
      relations: ["enrolledStudents", "tasks"]
    });

    let userSubmissions: any[] = [];
    if (userId) {
      userSubmissions = await this.submissionRepository.find({
        where: { learnerId: userId },
        relations: ["assignment"]
      });
    }

    return coursesWithRelations.map(course => {
      const isEnrolled = userId ? course.enrolledStudents?.some(u => u.id === userId) : false;
      const lessonCount = (course.tasks && course.tasks.length > 0) ? course.tasks.length : (course.lessonCount || 0);
      let progress = 0;
      
      if (isEnrolled && lessonCount > 0 && userId) {
        let completedCount = 0;
        if (course.tasks && course.tasks.length > 0) {
          course.tasks.forEach(task => {
            if (userSubmissions.some(s => s.assignment?.taskId === task.id && (s.status === "SUBMITTED" || s.status === "GRADED"))) {
              completedCount++;
            }
          });
        }
        progress = Math.round((completedCount / lessonCount) * 100);
      }

      return { ...this.mapToResponseDTO(course), isEnrolled, lessonCount, progress };
    });
  }

  async enrollCourse(courseId: string, learnerId: string): Promise<CourseResponseDTO> {
    const course = await this.courseRepository.findOne({ 
      where: { id: courseId, deletedAt: IsNull() },
      relations: ["enrolledStudents"]
    });
    if (!course) throw new NotFoundException(`Course with ID '${courseId}' not found`);

    const learner = await this.userRepository.findOne({ where: { id: learnerId } });
    if (!learner) throw new NotFoundException("User not found");

    if (!course.enrolledStudents) course.enrolledStudents = [];
    const alreadyEnrolled = course.enrolledStudents.some(u => u.id === learnerId);
    
    if (!alreadyEnrolled) {
      course.enrolledStudents.push(learner);
      course.enrolled += 1;
      await this.courseRepository.save(course);

      try {
        await this.courseRepository.createQueryBuilder()
          .relation(Course, "enrolledStudents")
          .of(course.id)
          .add(learner.id);
      } catch (e) {
        // Ignore if already added by cascade
      }

      // Notify course creator asynchronously
      (async () => {
        try {
          await this.notificationService.createNotification({
            userId: course.creatorId,
            title: "New Student Enrolled in Course",
            message: `${learner.firstName || learner.email} has enrolled in your course "${course.title}".`,
            type: NotificationType.COURSE_ENROLLED,
            link: `/course/${course.id}`,
          });
        } catch (err) {
          console.error("Failed to send enroll notification", err);
        }
      })();
    }

    return { ...this.mapToResponseDTO(course), isEnrolled: true };
  }

  async updateCourse(id: string, teacherId: string, dto: Partial<CreateCourseDTO>, isAdmin: boolean = false): Promise<CourseResponseDTO> {
    const course = await this.courseRepository.findOne({ where: { id, deletedAt: IsNull() } });
    if (!course) {
      throw new NotFoundException(`Course with ID '${id}' not found`);
    }

    if (!isAdmin && course.creatorId !== teacherId) {
      throw new ForbiddenException("You can only update your own courses.");
    }

    if (!isAdmin && course.status !== CourseStatus.DRAFT) {
      throw new BadRequestException("Only courses in DRAFT status can be updated.");
    }

    await this.courseRepository.update(id, dto);
    const updated = await this.courseRepository.findOne({ where: { id } });
    if (!updated) {
      throw new InternalServerErrorException(`Failed to update course with ID '${id}'`);
    }

    return this.mapToResponseDTO(updated);
  }

  async submitForReview(id: string, teacherId: string, isAdmin: boolean = false): Promise<CourseResponseDTO> {
    const course = await this.courseRepository.findOne({ where: { id, deletedAt: IsNull() } });
    if (!course) {
      throw new NotFoundException(`Course with ID '${id}' not found`);
    }

    if (!isAdmin && course.creatorId !== teacherId) {
      throw new ForbiddenException("You can only submit your own courses.");
    }

    if (course.status !== CourseStatus.DRAFT) {
      throw new BadRequestException("Only DRAFT courses can be submitted for review.");
    }

    course.status = CourseStatus.PENDING_REVIEW;
    await this.courseRepository.save(course);
    return this.mapToResponseDTO(course);
  }

  async reviewCourse(id: string, dto: ReviewCourseDTO): Promise<CourseResponseDTO> {
    const course = await this.courseRepository.findOne({ where: { id, deletedAt: IsNull() } });
    if (!course) {
      throw new NotFoundException(`Course with ID '${id}' not found`);
    }

    if (course.status !== CourseStatus.PENDING_REVIEW) {
      throw new BadRequestException("Only PENDING_REVIEW courses can be reviewed.");
    }

    if (dto.action === "REJECT" && !dto.reason) {
      throw new BadRequestException("Rejection reason is required.");
    }

    course.status = dto.action === "APPROVE" ? CourseStatus.PUBLISHED : CourseStatus.DRAFT;
    course.rejectionReason = dto.action === "REJECT" ? dto.reason : undefined;

    await this.courseRepository.save(course);
    return this.mapToResponseDTO(course);
  }

  async archiveCourse(id: string): Promise<CourseResponseDTO> {
    const course = await this.courseRepository.findOne({ where: { id, deletedAt: IsNull() } });
    if (!course) {
      throw new NotFoundException(`Course with ID '${id}' not found`);
    }

    if (course.status !== CourseStatus.PUBLISHED) {
      throw new BadRequestException("Only PUBLISHED courses can be archived.");
    }

    course.status = CourseStatus.ARCHIVED;
    await this.courseRepository.save(course);
    return this.mapToResponseDTO(course);
  }

  async deleteCourse(id: string, userId: string, isAdmin: boolean): Promise<boolean> {
    const course = await this.courseRepository.findOne({ where: { id, deletedAt: IsNull() } });
    if (!course) {
      throw new NotFoundException(`Course with ID '${id}' not found`);
    }

    if (!isAdmin && course.creatorId !== userId) {
      throw new ForbiddenException("You can only delete your own courses.");
    }

    // Soft delete
    await this.courseRepository.update(id, { deletedAt: new Date() });
    return true;
  }

  async addReview(id: string, userId: string, dto: { rating: number, comment: string }): Promise<CourseResponseDTO> {
    const course = await this.courseRepository.findOne({ where: { id, deletedAt: IsNull() } });
    if (!course) throw new NotFoundException(`Course with ID '${id}' not found`);

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException("User not found");

    const reviews = course.reviews || [];
    const newReview = {
      id: `rev_${Date.now()}`,
      userId: user.id,
      userName: `${user.firstName} ${user.lastName}`,
      userAvatar: user.avatar,
      rating: dto.rating,
      comment: dto.comment,
      createdAt: new Date().toISOString()
    };
    
    reviews.push(newReview);
    course.reviews = reviews;
    course.reviewCount = reviews.length;
    course.rating = reviews.reduce((acc, rev) => acc + rev.rating, 0) / reviews.length;

    await this.courseRepository.save(course);
    
    // Notify course creator asynchronously
    (async () => {
      try {
        await this.notificationService.createNotification({
          userId: course.creatorId,
          title: "New Course Review",
          message: `${user.firstName || user.email} left a ${dto.rating}-star review on "${course.title}".`,
          type: NotificationType.COURSE_REVIEWED,
          link: `/course/${course.id}?tab=reviews`,
        });
      } catch (err) {
        console.error("Failed to send review notification", err);
      }
    })();

    return this.mapToResponseDTO(course);
  }

  async updateReview(id: string, reviewId: string, userId: string, isAdmin: boolean, dto: { rating: number, comment: string }): Promise<CourseResponseDTO> {
    const course = await this.courseRepository.findOne({ where: { id, deletedAt: IsNull() } });
    if (!course) throw new NotFoundException(`Course with ID '${id}' not found`);

    const reviews = course.reviews || [];
    const revIndex = reviews.findIndex(r => r.id === reviewId);
    if (revIndex === -1) throw new NotFoundException(`Review not found`);

    if (!isAdmin && reviews[revIndex].userId !== userId) {
      throw new ForbiddenException("You can only edit your own reviews");
    }

    reviews[revIndex].rating = dto.rating;
    reviews[revIndex].comment = dto.comment;

    course.reviews = reviews;
    course.rating = reviews.reduce((acc, rev) => acc + rev.rating, 0) / reviews.length;

    await this.courseRepository.save(course);
    return this.mapToResponseDTO(course);
  }

  async deleteReview(id: string, reviewId: string, userId: string, isAdmin: boolean): Promise<CourseResponseDTO> {
    const course = await this.courseRepository.findOne({ where: { id, deletedAt: IsNull() } });
    if (!course) throw new NotFoundException(`Course with ID '${id}' not found`);

    let reviews = course.reviews || [];
    const revIndex = reviews.findIndex(r => r.id === reviewId);
    if (revIndex === -1) throw new NotFoundException(`Review not found`);

    if (!isAdmin && reviews[revIndex].userId !== userId) {
      throw new ForbiddenException("You can only delete your own reviews");
    }

    reviews.splice(revIndex, 1);
    course.reviews = reviews;
    course.reviewCount = reviews.length;
    course.rating = reviews.length > 0 ? reviews.reduce((acc, rev) => acc + rev.rating, 0) / reviews.length : 0;

    await this.courseRepository.save(course);
    return this.mapToResponseDTO(course);
  }

  async replyReview(id: string, reviewId: string, userId: string, isAdmin: boolean, dto: { comment: string }): Promise<CourseResponseDTO> {
    const course = await this.courseRepository.findOne({ where: { id, deletedAt: IsNull() } });
    if (!course) throw new NotFoundException(`Course with ID '${id}' not found`);

    if (!isAdmin && course.creatorId !== userId) {
      throw new ForbiddenException("Only the course creator or admin can reply to reviews");
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException("User not found");

    const reviews = course.reviews || [];
    const revIndex = reviews.findIndex(r => r.id === reviewId);
    if (revIndex === -1) throw new NotFoundException(`Review not found`);

    reviews[revIndex].reply = {
      userId: user.id,
      userName: `${user.firstName} ${user.lastName}`,
      comment: dto.comment,
      createdAt: new Date().toISOString()
    };

    course.reviews = reviews;
    await this.courseRepository.save(course);

    // Notify the student who wrote the review
    const reviewAuthorId = reviews[revIndex].userId;
    if (reviewAuthorId) {
      this.notificationService.createNotification({
        userId: reviewAuthorId,
        title: "Instructor Replied",
        message: `The instructor replied to your review on "${course.title}".`,
        type: NotificationType.COURSE_REVIEWED,
        link: `/course/${course.id}?tab=reviews`
      }).catch(console.error);
    }

    return this.mapToResponseDTO(course);
  }

  private mapToResponseDTO(course: Course): CourseResponseDTO {
    return {
      id: course.id,
      title: course.title,
      description: course.description,
      level: course.level,
      category: course.category,
      lessonCount: course.lessonCount,
      duration: course.duration,
      rating: course.rating,
      reviewCount: course.reviewCount,
      enrolled: course.enrolled,
      color: course.color,
      icon: course.icon,
      skills: course.skills,
      price: course.price,
      isFree: course.isFree,
      isFeatured: course.isFeatured,
      curriculum: course.curriculum,
      reviews: course.reviews,
      status: course.status,
      rejectionReason: course.rejectionReason || undefined,
      creatorId: course.creatorId,
      createdAt: course.createdAt,
      updatedAt: course.updatedAt,
      tasks: course.tasks as any,
    };
  }
}
