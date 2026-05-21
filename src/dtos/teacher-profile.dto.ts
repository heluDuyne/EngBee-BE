export class TeacherProfileResponseDTO {
  id!: string;
  userId!: string;
  specializations?: string[];
}

export class UpdateTeacherProfileDTO {
  specializations?: string[];
}
