import { AppDataSource } from "../data-source";
import { ChatMessage } from "../entities/ChatMessage";
import { ChatConversation, ConversationType } from "../entities/ChatConversation";
import { ChatParticipant } from "../entities/ChatParticipant";
import { User } from "../entities/User";
import { Class } from "../entities/Class";
import { UserRole } from "../enums";
import { In } from "typeorm";

export class ChatService {
  private chatMessageRepository = AppDataSource.getRepository(ChatMessage);
  private conversationRepository = AppDataSource.getRepository(ChatConversation);
  private participantRepository = AppDataSource.getRepository(ChatParticipant);
  private userRepository = AppDataSource.getRepository(User);
  private classRepository = AppDataSource.getRepository(Class);

  /**
   * Helper to find or create Admin Support conversation for a user
   */
  private async getOrCreateAdminSupportConversation(user: User): Promise<ChatConversation | null> {
    if (user.role === UserRole.ADMIN) return null; // Admins don't need "Admin Support"

    const admins = await this.userRepository.find({ where: { role: UserRole.ADMIN } });
    if (admins.length === 0) return null;

    // Use the first admin as the support contact
    const adminId = admins[0].id;

    return this.getOrCreateDirectConversation(user.id, adminId);
  }

  /**
   * Helper to find or create a direct conversation between two users
   */
  public async getOrCreateDirectConversation(userId1: string, userId2: string): Promise<ChatConversation> {
    // Look for existing direct conversation between these two
    const existing = await this.conversationRepository.createQueryBuilder("conv")
      .innerJoin("conv.participants", "p1", "p1.userId = :userId1", { userId1 })
      .innerJoin("conv.participants", "p2", "p2.userId = :userId2", { userId2 })
      .where("conv.type = :type", { type: ConversationType.DIRECT })
      .getOne();

    if (existing) {
      return existing;
    }

    // Create new
    const conv = this.conversationRepository.create({ type: ConversationType.DIRECT });
    await this.conversationRepository.save(conv);

    await this.participantRepository.save([
      { conversationId: conv.id, userId: userId1 },
      { conversationId: conv.id, userId: userId2 }
    ]);

    return conv;
  }

  /**
   * Helper to find or create a class group conversation
   */
  public async getOrCreateClassConversation(classId: string): Promise<ChatConversation> {
    let conv = await this.conversationRepository.findOne({
      where: { type: ConversationType.CLASS, classId }
    });

    if (!conv) {
      conv = this.conversationRepository.create({ type: ConversationType.CLASS, classId });
      await this.conversationRepository.save(conv);
    }

    // Ensure all class members are participants
    const cls = await this.classRepository.findOne({
      where: { id: classId },
      relations: ["teacher", "learners"]
    });

    if (cls) {
      const userIds = [cls.teacher.id, ...(cls.learners?.map(l => l.id) || [])];
      
      for (const uid of userIds) {
        const p = await this.participantRepository.findOne({ where: { conversationId: conv.id, userId: uid } });
        if (!p) {
          await this.participantRepository.save({ conversationId: conv.id, userId: uid });
        }
      }
    }

    return conv;
  }

  /**
   * Generate missing conversations (Admin Support, Teacher/Student direct, Class Group)
   * so they appear in the inbox.
   */
  public async ensureUserConversations(userId: string) {
    const user = await this.userRepository.findOne({ 
      where: { id: userId },
      relations: ["taughtClasses", "enrolledClasses", "enrolledClasses.teacher"] 
    });
    if (!user) return;

    if (user.role === UserRole.LEARNER) {
      await this.getOrCreateAdminSupportConversation(user);

      // Group chats and teacher direct chats
      for (const cls of user.enrolledClasses || []) {
        await this.getOrCreateClassConversation(cls.id);
        if (cls.teacher) {
          await this.getOrCreateDirectConversation(userId, cls.teacher.id);
        }
      }
    } else if (user.role === UserRole.TEACHER) {
      for (const cls of user.taughtClasses || []) {
        await this.getOrCreateClassConversation(cls.id);
      }
    }
  }

  /**
   * Get all conversations for a user
   */
  public async getUserConversations(userId: string) {
    await this.ensureUserConversations(userId);

    const participants = await this.participantRepository.find({
      where: { userId },
      relations: [
        "conversation", 
        "conversation.participants", 
        "conversation.participants.user",
        "conversation.participants.user.learnerProfile",
        "conversation.participants.user.teacherProfile"
      ]
    });

    const result = [];
    for (const p of participants) {
      const conv = p.conversation;
      
      // Get last message
      const lastMessage = await this.chatMessageRepository.findOne({
        where: { conversationId: conv.id },
        order: { createdAt: "DESC" },
        relations: ["sender"]
      });

      let name = "Conversation";
      let otherUserId = null;
      let otherUserRole = null;

      if (conv.type === ConversationType.DIRECT) {
        const otherP = conv.participants.find(pt => pt.userId !== userId);
        if (otherP) {
          otherUserId = otherP.userId;
          const ou = otherP.user;
          otherUserRole = ou.role;
          if (ou.role === UserRole.ADMIN) name = "Admin Support";
          else if (ou.firstName) name = `${ou.firstName} ${ou.lastName || ''}`.trim();
          else name = ou.email.split('@')[0];
        }
      } else if (conv.type === ConversationType.CLASS) {
        const cls = await this.classRepository.findOne({ where: { id: conv.classId } });
        name = cls ? `Class: ${cls.name}` : "Class Group";
      }

      result.push({
        id: conv.id,
        type: conv.type,
        name,
        otherUserId,
        otherUserRole,
        unreadCount: p.unreadCount,
        lastMessage: lastMessage ? {
          content: lastMessage.content,
          createdAt: lastMessage.createdAt,
          senderId: lastMessage.sender.id,
          senderName: lastMessage.sender.firstName || lastMessage.sender.email.split('@')[0]
        } : null
      });
    }

    // Sort by last message time descending
    result.sort((a, b) => {
      const timeA = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : 0;
      const timeB = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : 0;
      return timeB - timeA;
    });

    return result;
  }

  /**
   * Get messages for a specific conversation
   */
  public async getConversationMessages(userId: string, conversationId: string, limit: number = 50) {
    // Verify participation
    const p = await this.participantRepository.findOne({ where: { userId, conversationId } });
    if (!p) throw new Error("Unauthorized access to conversation");

    // Mark as read
    p.unreadCount = 0;
    p.lastReadAt = new Date();
    await this.participantRepository.save(p);

    const messages = await this.chatMessageRepository.find({
      where: { conversationId },
      order: { createdAt: "DESC" },
      take: limit,
      relations: ["sender", "sender.learnerProfile", "sender.teacherProfile"]
    });

    return messages.reverse();
  }

  /**
   * Save a new message
   */
  public async saveMessage(userId: string, conversationId: string, content: string): Promise<ChatMessage> {
    // Verify participation
    const p = await this.participantRepository.findOne({ where: { userId, conversationId } });
    if (!p) throw new Error("Unauthorized to send message in this conversation");

    const message = this.chatMessageRepository.create({
      senderId: userId,
      conversationId,
      content,
    });
    
    const savedMessage = await this.chatMessageRepository.save(message);

    // Increment unread count for others
    await AppDataSource.createQueryBuilder()
      .update(ChatParticipant)
      .set({ unreadCount: () => "unreadCount + 1" })
      .where("conversation_id = :conversationId", { conversationId })
      .andWhere("user_id != :userId", { userId })
      .execute();
    
    return this.chatMessageRepository.findOne({
      where: { id: savedMessage.id },
      relations: ["sender", "sender.learnerProfile", "sender.teacherProfile", "conversation"],
    }) as Promise<ChatMessage>;
  }
}
