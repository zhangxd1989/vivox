import { getDatabase } from "./config";
import { ChatConversation } from "@/types";
import { safeLocalStorage } from "@/lib";

// Legacy localStorage key for migration purposes
const LEGACY_CHAT_HISTORY_KEY = "chat_history";

/**
 * Database conversation type (flattened for SQL)
 */
interface DbConversation {
  id: string;
  title: string;
  created_at: number;
  updated_at: number;
}

/**
 * Database message type (flattened for SQL)
 */
interface DbMessage {
  id: string;
  conversation_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
  attached_files: string | null; // JSON string
}

/**
 * Safely parse JSON with error handling
 */
function safeJsonParse<T>(jsonString: string | null, fallback: T): T {
  if (!jsonString) return fallback;
  try {
    return JSON.parse(jsonString) as T;
  } catch (error) {
    console.error("解析 JSON 失败:", error);
    return fallback;
  }
}

/**
 * Validate conversation data
 */
function validateConversation(conversation: ChatConversation): boolean {
  if (!conversation.id || typeof conversation.id !== "string") {
    console.error("无效对话: 缺少或无效的 ID");
    return false;
  }
  if (!conversation.title || typeof conversation.title !== "string") {
    console.error("无效对话: 缺少或无效的标题");
    return false;
  }
  if (!Array.isArray(conversation.messages)) {
    console.error("无效对话: 消息不是数组");
    return false;
  }
  return true;
}

/**
 * Validate message data
 */
function validateMessage(message: any): boolean {
  if (!message.id || typeof message.id !== "string") {
    console.error("无效消息: 缺少或无效的 ID");
    return false;
  }
  if (
    !message.role ||
    !["user", "assistant", "system"].includes(message.role)
  ) {
    console.error("无效消息: 缺少或无效的角色");
    return false;
  }
  if (typeof message.content !== "string") {
    console.error("无效消息: 内容必须是字符串");
    return false;
  }
  if (typeof message.timestamp !== "number" || message.timestamp < 0) {
    console.error("无效消息: 无效的时间戳");
    return false;
  }
  return true;
}

/**
 * Create a new conversation with transaction safety
 */
export async function createConversation(
  conversation: ChatConversation
): Promise<ChatConversation> {
  if (!validateConversation(conversation)) {
    throw new Error("无效对话数据");
  }

  const db = await getDatabase();

  try {
    // Insert conversation
    await db.execute(
      "INSERT INTO conversations (id, title, created_at, updated_at) VALUES (?, ?, ?, ?)",
      [
        conversation.id,
        conversation.title,
        conversation.createdAt || Date.now(),
        conversation.updatedAt || Date.now(),
      ]
    );

    // Insert all messages
    for (const message of conversation.messages) {
      if (!validateMessage(message)) {
        console.warn("跳过对话创建中的无效消息");
        continue;
      }

      const attachedFilesJson = message.attachedFiles
        ? JSON.stringify(message.attachedFiles)
        : null;

      await db.execute(
        "INSERT INTO messages (id, conversation_id, role, content, timestamp, attached_files) VALUES (?, ?, ?, ?, ?, ?)",
        [
          message.id,
          conversation.id,
          message.role,
          message.content,
          message.timestamp,
          attachedFilesJson,
        ]
      );
    }

    return conversation;
  } catch (error) {
    console.error("创建对话失败:", error);
    // Rollback: delete conversation if message insertion failed
    await db
      .execute("DELETE FROM conversations WHERE id = ?", [conversation.id])
      .catch(() => {});
    throw error;
  }
}

/**
 * Get all conversations with messages in a single optimized query
 */
export async function getAllConversations(): Promise<ChatConversation[]> {
  const db = await getDatabase();

  try {
    // Get all conversations
    const conversations = await db.select<DbConversation[]>(
      "SELECT * FROM conversations ORDER BY updated_at DESC"
    );

    if (conversations.length === 0) {
      return [];
    }

    // Get all messages for these conversations in one query
    const conversationIds = conversations.map((c) => c.id);
    const placeholders = conversationIds.map(() => "?").join(",");
    const allMessages = await db.select<DbMessage[]>(
      `SELECT * FROM messages WHERE conversation_id IN (${placeholders}) ORDER BY conversation_id, timestamp ASC`,
      conversationIds
    );

    // Group messages by conversation_id
    const messagesByConversation = new Map<string, DbMessage[]>();
    for (const msg of allMessages) {
      if (!messagesByConversation.has(msg.conversation_id)) {
        messagesByConversation.set(msg.conversation_id, []);
      }
      messagesByConversation.get(msg.conversation_id)!.push(msg);
    }

    // Build result
    return conversations.map((conv) => ({
      id: conv.id,
      title: conv.title,
      createdAt: conv.created_at,
      updatedAt: conv.updated_at,
      messages:
        messagesByConversation.get(conv.id)?.map((msg) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp,
          attachedFiles: safeJsonParse(msg.attached_files, undefined),
        })) || [],
    }));
  } catch (error) {
    console.error("获取所有对话失败:", error);
    throw error;
  }
}

/**
 * Get a single conversation by ID
 */
export async function getConversationById(
  id: string
): Promise<ChatConversation | null> {
  if (!id || typeof id !== "string") {
    console.error("无效对话 ID");
    return null;
  }

  const db = await getDatabase();

  try {
    // Get conversation
    const conversations = await db.select<DbConversation[]>(
      "SELECT * FROM conversations WHERE id = ?",
      [id]
    );

    if (conversations.length === 0) {
      return null;
    }

    const conv = conversations[0];

    // Get messages
    const messages = await db.select<DbMessage[]>(
      "SELECT * FROM messages WHERE conversation_id = ? ORDER BY timestamp ASC",
      [id]
    );

    return {
      id: conv.id,
      title: conv.title,
      createdAt: conv.created_at,
      updatedAt: conv.updated_at,
      messages: messages.map((msg) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp,
        attachedFiles: safeJsonParse(msg.attached_files, undefined),
      })),
    };
  } catch (error) {
    console.error(`获取对话 ${id} 失败:`, error);
    return null;
  }
}

/**
 * Update a conversation with transaction safety
 */
export async function updateConversation(
  conversation: ChatConversation
): Promise<ChatConversation> {
  if (!validateConversation(conversation)) {
    throw new Error("无效对话数据");
  }

  const db = await getDatabase();

  try {
    // Update conversation
    const updateResult = await db.execute(
      "UPDATE conversations SET title = ?, updated_at = ? WHERE id = ?",
      [conversation.title, conversation.updatedAt, conversation.id]
    );

    if (updateResult.rowsAffected === 0) {
      throw new Error("未找到对话");
    }

    // Get existing messages for backup
    const existingMessages = await db.select<DbMessage[]>(
      "SELECT * FROM messages WHERE conversation_id = ?",
      [conversation.id]
    );

    // Delete existing messages
    await db.execute("DELETE FROM messages WHERE conversation_id = ?", [
      conversation.id,
    ]);

    // Insert updated messages
    try {
      for (const message of conversation.messages) {
        if (!validateMessage(message)) {
          console.warn("跳过对话更新中的无效消息");
          continue;
        }

        const attachedFilesJson = message.attachedFiles
          ? JSON.stringify(message.attachedFiles)
          : null;

        await db.execute(
          "INSERT INTO messages (id, conversation_id, role, content, timestamp, attached_files) VALUES (?, ?, ?, ?, ?, ?)",
          [
            message.id,
            conversation.id,
            message.role,
            message.content,
            message.timestamp,
            attachedFilesJson,
          ]
        );
      }
    } catch (messageError) {
      // Rollback: restore original messages
      console.error(
        "插入新消息失败, 恢复备份:",
        messageError
      );
      for (const msg of existingMessages) {
        await db
          .execute(
            "INSERT INTO messages (id, conversation_id, role, content, timestamp, attached_files) VALUES (?, ?, ?, ?, ?, ?)",
            [
              msg.id,
              msg.conversation_id,
              msg.role,
              msg.content,
              msg.timestamp,
              msg.attached_files,
            ]
          )
          .catch(() => {});
      }
      throw messageError;
    }

    return conversation;
  } catch (error) {
    console.error("更新对话失败:", error);
    throw error;
  }
}

/**
 * Save or update a conversation (upsert operation)
 */
export async function saveConversation(
  conversation: ChatConversation
): Promise<ChatConversation> {
  if (!validateConversation(conversation)) {
    throw new Error("Invalid conversation data");
  }

  try {
    const existing = await getConversationById(conversation.id);

    if (existing) {
      return await updateConversation(conversation);
    } else {
      return await createConversation(conversation);
    }
  } catch (error) {
    console.error("保存对话失败:", error);
    throw error;
  }
}

/**
 * Delete a conversation and all its messages
 */
export async function deleteConversation(id: string): Promise<boolean> {
  if (!id || typeof id !== "string") {
    console.error("无效对话 ID");
    return false;
  }

  const db = await getDatabase();

  try {
    const result = await db.execute("DELETE FROM conversations WHERE id = ?", [
      id,
    ]);

    return result.rowsAffected > 0;
  } catch (error) {
    console.error(`删除对话 ${id} 失败:`, error);
    throw error;
  }
}

/**
 * Delete all conversations and messages
 */
export async function deleteAllConversations(): Promise<void> {
  const db = await getDatabase();

  try {
    // Delete in correct order (messages first due to foreign key)
    await db.execute("DELETE FROM messages");
    await db.execute("DELETE FROM conversations");
  } catch (error) {
    console.error("删除所有对话失败:", error);
    throw error;
  }
}

/**
 * Return the user message as the conversation title
 */
export function generateConversationTitle(userMessage: string): string {
  return userMessage.trim();
}

/**
 * Migrate chat history from localStorage to SQLite
 * This function safely moves all existing localStorage chat history to the database
 */
export async function migrateLocalStorageToSQLite(): Promise<{
  success: boolean;
  migratedCount: number;
  error?: string;
}> {
  const migrationKey = "chat_history_migrated_to_sqlite";

  try {
    // Check if migration has already been done
    if (safeLocalStorage.getItem(migrationKey) === "true") {
      return { success: true, migratedCount: 0 };
    }

    // Get existing localStorage data
    const existingData = safeLocalStorage.getItem(LEGACY_CHAT_HISTORY_KEY);
    if (!existingData) {
      // No data to migrate
      safeLocalStorage.setItem(migrationKey, "true");
      return { success: true, migratedCount: 0 };
    }

    // Parse localStorage conversations
    let conversations: ChatConversation[] = [];
    try {
      const parsed = JSON.parse(existingData);
      conversations = Array.isArray(parsed) ? parsed : [];
    } catch (parseError) {
      console.error("解析 localStorage 对话历史失败:", parseError);
      // Mark as migrated anyway to prevent repeated failures
      safeLocalStorage.setItem(migrationKey, "true");
      return {
        success: false,
        migratedCount: 0,
        error: "解析 localStorage 数据失败",
      };
    }

    if (conversations.length === 0) {
      // No valid data to migrate
      safeLocalStorage.setItem(migrationKey, "true");
      return { success: true, migratedCount: 0 };
    }

    // Get database instance
    const db = await getDatabase();

    // Migrate each conversation
    let migratedCount = 0;
    let errorCount = 0;

    for (const conversation of conversations) {
      try {
        // Validate conversation data
        if (!conversation?.id || !conversation?.title) {
          console.warn("跳过无效对话:", conversation);
          errorCount++;
          continue;
        }

        // Check if conversation already exists in database
        const existing = await getConversationById(conversation.id);
        if (existing) {
          console.log(
            `对话 ${conversation.id} 已存在, 跳过`
          );
          continue;
        }

        // Insert conversation
        await db.execute(
          "INSERT INTO conversations (id, title, created_at, updated_at) VALUES (?, ?, ?, ?)",
          [
            conversation.id,
            conversation.title,
            conversation.createdAt || Date.now(),
            conversation.updatedAt || Date.now(),
          ]
        );

        // Insert messages
        if (
          Array.isArray(conversation.messages) &&
          conversation.messages.length > 0
        ) {
          for (const message of conversation.messages) {
            // Validate message
            if (
              !message?.id ||
              !message?.role ||
              typeof message?.content !== "string"
            ) {
              console.warn(
                `跳过对话 ${conversation.id} 中的无效消息:`,
                message
              );
              continue;
            }

            const attachedFilesJson = message.attachedFiles
              ? JSON.stringify(message.attachedFiles)
              : null;

            await db.execute(
              "INSERT INTO messages (id, conversation_id, role, content, timestamp, attached_files) VALUES (?, ?, ?, ?, ?, ?)",
              [
                message.id,
                conversation.id,
                message.role,
                message.content,
                message.timestamp || Date.now(),
                attachedFilesJson,
              ]
            );
          }
        }

        migratedCount++;
      } catch (convError) {
        console.error(
          `迁移对话 ${conversation?.id} 失败:`,
          convError
        );
        errorCount++;
        // Clean up partially migrated conversation
        await db
          .execute("DELETE FROM conversations WHERE id = ?", [conversation?.id])
          .catch(() => {});
      }
    }

    // Mark migration as complete even if some failed
    safeLocalStorage.setItem(migrationKey, "true");

    // Clear localStorage chat history after migration attempt
    safeLocalStorage.removeItem(LEGACY_CHAT_HISTORY_KEY);

    const message =
      errorCount > 0
        ? `已迁移 ${migratedCount}/${conversations.length} 个对话 (${errorCount} 个失败)`
        : `成功迁移 ${migratedCount} 个对话`;

    console.log(message);

    return {
      success: migratedCount > 0 || errorCount === 0,
      migratedCount,
      error:
        errorCount > 0
          ? `${errorCount} 个对话迁移失败`
          : undefined,
    };
  } catch (error) {
    console.error("迁移失败:", error);
    // Mark as attempted to prevent infinite retry loops
    safeLocalStorage.setItem(migrationKey, "true");
    return {
      success: false,
      migratedCount: 0,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
