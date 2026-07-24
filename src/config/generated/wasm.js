
Object.defineProperty(exports, "__esModule", { value: true });

const {
  Decimal,
  objectEnumValues,
  makeStrictEnum,
  Public,
  getRuntime,
  skip
} = require('./runtime/index-browser.js')


const Prisma = {}

exports.Prisma = Prisma
exports.$Enums = {}

/**
 * Prisma Client JS version: 5.22.0
 * Query Engine version: 605197351a3c8bdd595af2d2a9bc3025bca48ea2
 */
Prisma.prismaVersion = {
  client: "5.22.0",
  engine: "605197351a3c8bdd595af2d2a9bc3025bca48ea2"
}

Prisma.PrismaClientKnownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientKnownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)};
Prisma.PrismaClientUnknownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientUnknownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientRustPanicError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientRustPanicError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientInitializationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientInitializationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientValidationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientValidationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.NotFoundError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`NotFoundError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`sqltag is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.empty = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`empty is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.join = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`join is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.raw = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`raw is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.getExtensionContext is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.defineExtension = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.defineExtension is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}

/**
 * Shorthand utilities for JSON filtering
 */
Prisma.DbNull = objectEnumValues.instances.DbNull
Prisma.JsonNull = objectEnumValues.instances.JsonNull
Prisma.AnyNull = objectEnumValues.instances.AnyNull

Prisma.NullTypes = {
  DbNull: objectEnumValues.classes.DbNull,
  JsonNull: objectEnumValues.classes.JsonNull,
  AnyNull: objectEnumValues.classes.AnyNull
}



/**
 * Enums
 */

exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
  ReadUncommitted: 'ReadUncommitted',
  ReadCommitted: 'ReadCommitted',
  RepeatableRead: 'RepeatableRead',
  Serializable: 'Serializable'
});

exports.Prisma.UserScalarFieldEnum = {
  id: 'id',
  uniqueId: 'uniqueId',
  phone: 'phone',
  email: 'email',
  passwordHash: 'passwordHash',
  wechatOpenId: 'wechatOpenId',
  wechatUnionId: 'wechatUnionId',
  nickname: 'nickname',
  avatar: 'avatar',
  membershipLevel: 'membershipLevel',
  isActive: 'isActive',
  isVerified: 'isVerified',
  failedLoginAttempts: 'failedLoginAttempts',
  lockedUntil: 'lockedUntil',
  lastLoginAt: 'lastLoginAt',
  lastLoginIp: 'lastLoginIp',
  xp: 'xp',
  level: 'level',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.UserIdentityScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  identityType: 'identityType',
  metadata: 'metadata',
  defaultWorkspaceId: 'defaultWorkspaceId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.WorkspaceScalarFieldEnum = {
  id: 'id',
  name: 'name',
  type: 'type',
  ownerId: 'ownerId',
  isDefault: 'isDefault',
  config: 'config',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.UserLanguagePreferenceScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  nativeLanguage: 'nativeLanguage',
  interfaceLanguage: 'interfaceLanguage',
  defaultExplanationLanguage: 'defaultExplanationLanguage',
  fallbackLanguage: 'fallbackLanguage',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.UserLearningLanguageScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  languageCode: 'languageCode',
  level: 'level',
  priority: 'priority',
  status: 'status',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.GuestSessionScalarFieldEnum = {
  id: 'id',
  deviceId: 'deviceId',
  localProgress: 'localProgress',
  convertedUserId: 'convertedUserId',
  convertedAt: 'convertedAt',
  lastActiveAt: 'lastActiveAt',
  createdAt: 'createdAt'
};

exports.Prisma.SessionScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  token: 'token',
  refreshToken: 'refreshToken',
  deviceInfo: 'deviceInfo',
  ipAddress: 'ipAddress',
  userAgent: 'userAgent',
  expiresAt: 'expiresAt',
  lastUsedAt: 'lastUsedAt',
  createdAt: 'createdAt'
};

exports.Prisma.SmsVerificationScalarFieldEnum = {
  id: 'id',
  phone: 'phone',
  code: 'code',
  type: 'type',
  verified: 'verified',
  expiresAt: 'expiresAt',
  createdAt: 'createdAt'
};

exports.Prisma.CheckinScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  checkinDate: 'checkinDate',
  streak: 'streak',
  xpAwarded: 'xpAwarded',
  createdAt: 'createdAt'
};

exports.Prisma.UserQuotaScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  dailyConversation: 'dailyConversation',
  dailyCorrection: 'dailyCorrection',
  maxConversation: 'maxConversation',
  maxCorrection: 'maxCorrection',
  resetAt: 'resetAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.LearningEventScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  eventType: 'eventType',
  duration: 'duration',
  metadata: 'metadata',
  createdAt: 'createdAt'
};

exports.Prisma.UserWordScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  word: 'word',
  language: 'language',
  mastery: 'mastery',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.LanguageScalarFieldEnum = {
  id: 'id',
  code: 'code',
  name: 'name',
  nameEn: 'nameEn',
  nameLocal: 'nameLocal',
  isActive: 'isActive',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.CourseScalarFieldEnum = {
  id: 'id',
  languageId: 'languageId',
  title: 'title',
  description: 'description',
  level: 'level',
  sortOrder: 'sortOrder',
  iconUrl: 'iconUrl',
  isPublished: 'isPublished',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.CourseUnitScalarFieldEnum = {
  id: 'id',
  courseId: 'courseId',
  title: 'title',
  description: 'description',
  sortOrder: 'sortOrder',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.CourseItemScalarFieldEnum = {
  id: 'id',
  unitId: 'unitId',
  itemType: 'itemType',
  title: 'title',
  content: 'content',
  sortOrder: 'sortOrder',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.UserCourseProgressScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  itemId: 'itemId',
  status: 'status',
  score: 'score',
  attempts: 'attempts',
  lastAttemptAt: 'lastAttemptAt',
  completedAt: 'completedAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.AIConversationScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  title: 'title',
  language: 'language',
  level: 'level',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.AIMessageScalarFieldEnum = {
  id: 'id',
  conversationId: 'conversationId',
  role: 'role',
  content: 'content',
  createdAt: 'createdAt'
};

exports.Prisma.AITranslationScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  sourceText: 'sourceText',
  translatedText: 'translatedText',
  sourceLang: 'sourceLang',
  targetLang: 'targetLang',
  createdAt: 'createdAt'
};

exports.Prisma.AICorrectionScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  originalText: 'originalText',
  correctedText: 'correctedText',
  errors: 'errors',
  tips: 'tips',
  language: 'language',
  createdAt: 'createdAt'
};

exports.Prisma.SRSDeckScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  title: 'title',
  language: 'language',
  description: 'description',
  cardCount: 'cardCount',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SRSCardScalarFieldEnum = {
  id: 'id',
  deckId: 'deckId',
  front: 'front',
  back: 'back',
  notes: 'notes',
  easeFactor: 'easeFactor',
  interval: 'interval',
  repetitions: 'repetitions',
  nextReviewAt: 'nextReviewAt',
  lastReviewAt: 'lastReviewAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SRSReviewScalarFieldEnum = {
  id: 'id',
  cardId: 'cardId',
  userId: 'userId',
  quality: 'quality',
  elapsedMs: 'elapsedMs',
  reviewedAt: 'reviewedAt'
};

exports.Prisma.LearningReportScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  reportDate: 'reportDate',
  studyMinutes: 'studyMinutes',
  wordsLearned: 'wordsLearned',
  wordsReviewed: 'wordsReviewed',
  xpEarned: 'xpEarned',
  conversationsCount: 'conversationsCount',
  correctionsCount: 'correctionsCount',
  streakDays: 'streakDays',
  createdAt: 'createdAt'
};

exports.Prisma.MembershipScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  level: 'level',
  startedAt: 'startedAt',
  expiresAt: 'expiresAt',
  autoRenew: 'autoRenew',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.MembershipTransactionScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  type: 'type',
  level: 'level',
  amount: 'amount',
  currency: 'currency',
  status: 'status',
  paymentMethod: 'paymentMethod',
  createdAt: 'createdAt'
};

exports.Prisma.StaminaScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  current: 'current',
  max: 'max',
  lastRefillAt: 'lastRefillAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.StaminaTransactionScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  amount: 'amount',
  reason: 'reason',
  reference: 'reference',
  createdAt: 'createdAt'
};

exports.Prisma.InviteCodeScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  code: 'code',
  usageCount: 'usageCount',
  maxUses: 'maxUses',
  isActive: 'isActive',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.InviteRecordScalarFieldEnum = {
  id: 'id',
  inviteCodeId: 'inviteCodeId',
  inviterUserId: 'inviterUserId',
  inviteeUserId: 'inviteeUserId',
  status: 'status',
  rewardedAt: 'rewardedAt',
  createdAt: 'createdAt'
};

exports.Prisma.CommissionScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  amount: 'amount',
  currency: 'currency',
  status: 'status',
  source: 'source',
  reference: 'reference',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.NullableJsonNullValueInput = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull
};

exports.Prisma.JsonNullValueInput = {
  JsonNull: Prisma.JsonNull
};

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};

exports.Prisma.JsonNullValueFilter = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull,
  AnyNull: Prisma.AnyNull
};


exports.Prisma.ModelName = {
  User: 'User',
  UserIdentity: 'UserIdentity',
  Workspace: 'Workspace',
  UserLanguagePreference: 'UserLanguagePreference',
  UserLearningLanguage: 'UserLearningLanguage',
  GuestSession: 'GuestSession',
  Session: 'Session',
  SmsVerification: 'SmsVerification',
  Checkin: 'Checkin',
  UserQuota: 'UserQuota',
  LearningEvent: 'LearningEvent',
  UserWord: 'UserWord',
  Language: 'Language',
  Course: 'Course',
  CourseUnit: 'CourseUnit',
  CourseItem: 'CourseItem',
  UserCourseProgress: 'UserCourseProgress',
  AIConversation: 'AIConversation',
  AIMessage: 'AIMessage',
  AITranslation: 'AITranslation',
  AICorrection: 'AICorrection',
  SRSDeck: 'SRSDeck',
  SRSCard: 'SRSCard',
  SRSReview: 'SRSReview',
  LearningReport: 'LearningReport',
  Membership: 'Membership',
  MembershipTransaction: 'MembershipTransaction',
  Stamina: 'Stamina',
  StaminaTransaction: 'StaminaTransaction',
  InviteCode: 'InviteCode',
  InviteRecord: 'InviteRecord',
  Commission: 'Commission'
};

/**
 * This is a stub Prisma Client that will error at runtime if called.
 */
class PrismaClient {
  constructor() {
    return new Proxy(this, {
      get(target, prop) {
        let message
        const runtime = getRuntime()
        if (runtime.isEdge) {
          message = `PrismaClient is not configured to run in ${runtime.prettyName}. In order to run Prisma Client on edge runtime, either:
- Use Prisma Accelerate: https://pris.ly/d/accelerate
- Use Driver Adapters: https://pris.ly/d/driver-adapters
`;
        } else {
          message = 'PrismaClient is unable to run in this browser environment, or has been bundled for the browser (running in `' + runtime.prettyName + '`).'
        }
        
        message += `
If this is unexpected, please open an issue: https://pris.ly/prisma-prisma-bug-report`

        throw new Error(message)
      }
    })
  }
}

exports.PrismaClient = PrismaClient

Object.assign(exports, Prisma)
