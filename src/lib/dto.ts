/**
 * Data Transfer Objects (DTOs) for the ETMS application.
 *
 * RULE: Every function in this file converts a Prisma model into a
 * plain JSON-serializable object. No Date, BigInt, Decimal, or Prisma
 * relation objects may cross the Server → Client boundary.
 *
 * All Date fields are converted to ISO strings.
 * All nullable relations are preserved as null.
 */

// ---------------------------------------------------------------------------
// Primitive serialization helpers
// ---------------------------------------------------------------------------

export function toIso(date: Date | null | undefined): string | null {
  return date ? date.toISOString() : null;
}

export function toDateStr(date: Date | null | undefined): string | null {
  if (!date) return null;
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ---------------------------------------------------------------------------
// Department DTO
// ---------------------------------------------------------------------------

export type DepartmentDTO = {
  id: string;
  name: string;
  description: string | null;
  managerName: string | null;
  color: string;
  createdAt: string;
  updatedAt: string;
};

export function toDepartmentDTO(dept: {
  id: string;
  name: string;
  description?: string | null;
  managerName?: string | null;
  color: string;
  createdAt: Date;
  updatedAt: Date;
}): DepartmentDTO {
  return {
    id: dept.id,
    name: dept.name,
    description: dept.description ?? null,
    managerName: dept.managerName ?? null,
    color: dept.color,
    createdAt: toIso(dept.createdAt)!,
    updatedAt: toIso(dept.updatedAt)!,
  };
}

// ---------------------------------------------------------------------------
// User DTO (safe subset — no password hash)
// ---------------------------------------------------------------------------

export type UserDTO = {
  id: string;
  email: string | null;
  username: string | null;
  employeeId: string | null;
  role: string;
  isActive: boolean;
  mustChangePassword: boolean;
};

export function toUserDTO(user: {
  id: string;
  email?: string | null;
  username?: string | null;
  employeeId?: string | null;
  role: string;
  isActive: boolean;
  mustChangePassword: boolean;
}): UserDTO {
  return {
    id: user.id,
    email: user.email ?? null,
    username: user.username ?? null,
    employeeId: user.employeeId ?? null,
    role: user.role,
    isActive: user.isActive,
    mustChangePassword: user.mustChangePassword,
  };
}

// ---------------------------------------------------------------------------
// Employee DTO
// ---------------------------------------------------------------------------

export type EmployeeDTO = {
  id: string;
  userId: string;
  departmentId: string | null;
  fullName: string;
  employeeCode: string;
  jobTitle: string;
  manager: string | null;
  phone: string | null;
  nationalId: string | null;
  joiningDate: string;       // ISO string
  birthDate: string | null;  // ISO string
  gender: string;
  address: string | null;
  emergencyContact: string | null;
  notes: string | null;
  photoUrl: string | null;
  status: string;
  xp: number;
  level: number;
  streakDays: number;
  createdAt: string;
  updatedAt: string;
  // Relations (optional, included only when fetched)
  user: UserDTO | null;
  department: DepartmentDTO | null;
  assignments: AssignmentSummaryDTO[];
};

export type AssignmentSummaryDTO = {
  id: string;
  status: string;
};

export function toEmployeeDTO(emp: {
  id: string;
  userId: string;
  departmentId?: string | null;
  fullName: string;
  employeeCode: string;
  jobTitle: string;
  manager?: string | null;
  phone?: string | null;
  nationalId?: string | null;
  joiningDate: Date;
  birthDate?: Date | null;
  gender: string;
  address?: string | null;
  emergencyContact?: string | null;
  notes?: string | null;
  photoUrl?: string | null;
  status: string;
  xp: number;
  level: number;
  streakDays: number;
  createdAt: Date;
  updatedAt: Date;
  user?: {
    id: string;
    email?: string | null;
    username?: string | null;
    employeeId?: string | null;
    role: string;
    isActive: boolean;
    mustChangePassword: boolean;
  } | null;
  department?: {
    id: string;
    name: string;
    description?: string | null;
    managerName?: string | null;
    color: string;
    createdAt: Date;
    updatedAt: Date;
  } | null;
  assignments?: Array<{ id: string; status: string }>;
}): EmployeeDTO {
  return {
    id: emp.id,
    userId: emp.userId,
    departmentId: emp.departmentId ?? null,
    fullName: emp.fullName,
    employeeCode: emp.employeeCode,
    jobTitle: emp.jobTitle,
    manager: emp.manager ?? null,
    phone: emp.phone ?? null,
    nationalId: emp.nationalId ?? null,
    joiningDate: toIso(emp.joiningDate)!,
    birthDate: toIso(emp.birthDate),
    gender: emp.gender,
    address: emp.address ?? null,
    emergencyContact: emp.emergencyContact ?? null,
    notes: emp.notes ?? null,
    photoUrl: emp.photoUrl ?? null,
    status: emp.status,
    xp: emp.xp,
    level: emp.level,
    streakDays: emp.streakDays,
    createdAt: toIso(emp.createdAt)!,
    updatedAt: toIso(emp.updatedAt)!,
    user: emp.user ? toUserDTO(emp.user) : null,
    department: emp.department ? toDepartmentDTO(emp.department) : null,
    assignments: emp.assignments?.map((a) => ({ id: a.id, status: a.status })) ?? [],
  };
}

// ---------------------------------------------------------------------------
// Training Asset DTO
// ---------------------------------------------------------------------------

export type TrainingAssetDTO = {
  id: string;
  trainingId: string;
  type: string;
  title: string;
  url: string;
  fileName: string | null;
  mimeType: string | null;
  sizeBytes: number | null;
  durationSeconds: number | null;
  sortOrder: number;
  createdAt: string;
};

export function toTrainingAssetDTO(asset: {
  id: string;
  trainingId: string;
  type: string;
  title: string;
  url: string;
  fileName?: string | null;
  mimeType?: string | null;
  sizeBytes?: number | null;
  durationSeconds?: number | null;
  sortOrder: number;
  createdAt: Date;
}): TrainingAssetDTO {
  return {
    id: asset.id,
    trainingId: asset.trainingId,
    type: asset.type,
    title: asset.title,
    url: asset.url,
    fileName: asset.fileName ?? null,
    mimeType: asset.mimeType ?? null,
    sizeBytes: asset.sizeBytes ?? null,
    durationSeconds: asset.durationSeconds ?? null,
    sortOrder: asset.sortOrder,
    createdAt: toIso(asset.createdAt)!,
  };
}

// ---------------------------------------------------------------------------
// Training DTO
// ---------------------------------------------------------------------------

export type TrainingDTO = {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  estimatedMinutes: number;
  dueDate: string | null;   // ISO string
  thumbnailUrl: string | null;
  priority: string;
  status: string;
  tags: string[];
  completionCriteria: string;
  createdAt: string;
  updatedAt: string;
  assets: TrainingAssetDTO[];
  assignmentCount: number;
};

export function toTrainingDTO(training: {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  estimatedMinutes: number;
  dueDate?: Date | null;
  thumbnailUrl?: string | null;
  priority: string;
  status: string;
  tags: string[];
  completionCriteria: string;
  createdAt: Date;
  updatedAt: Date;
  assets?: Array<{
    id: string;
    trainingId: string;
    type: string;
    title: string;
    url: string;
    fileName?: string | null;
    mimeType?: string | null;
    sizeBytes?: number | null;
    durationSeconds?: number | null;
    sortOrder: number;
    createdAt: Date;
  }>;
  assignments?: Array<{ id: string }>;
}): TrainingDTO {
  return {
    id: training.id,
    title: training.title,
    description: training.description,
    category: training.category,
    difficulty: training.difficulty,
    estimatedMinutes: training.estimatedMinutes,
    dueDate: toIso(training.dueDate),
    thumbnailUrl: training.thumbnailUrl ?? null,
    priority: training.priority,
    status: training.status,
    tags: training.tags,
    completionCriteria: training.completionCriteria,
    createdAt: toIso(training.createdAt)!,
    updatedAt: toIso(training.updatedAt)!,
    assets: training.assets?.map(toTrainingAssetDTO) ?? [],
    assignmentCount: training.assignments?.length ?? 0,
  };
}

// ---------------------------------------------------------------------------
// Assignment DTO
// ---------------------------------------------------------------------------

export type AssignmentDTO = {
  id: string;
  employeeId: string;
  trainingId: string;
  status: string;
  progressPercent: number;
  timeWatchedSec: number;
  startedAt: string | null;
  completedAt: string | null;
  dueDate: string | null;     // ISO string
  learningSummary: string | null;
  completionNotes: string | null;
  reviewStatus: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  reviewNote: string | null;
  createdAt: string;
  updatedAt: string;
  employee: EmployeeDTO | null;
  training: TrainingDTO | null;
};

export function toAssignmentDTO(assignment: {
  id: string;
  employeeId: string;
  trainingId: string;
  status: string;
  progressPercent: number;
  timeWatchedSec: number;
  startedAt?: Date | null;
  completedAt?: Date | null;
  dueDate?: Date | null;
  learningSummary?: string | null;
  completionNotes?: string | null;
  reviewStatus?: string | null;
  reviewedBy?: string | null;
  reviewedAt?: Date | null;
  reviewNote?: string | null;
  createdAt: Date;
  updatedAt: Date;
  employee?: Parameters<typeof toEmployeeDTO>[0] | null;
  training?: Parameters<typeof toTrainingDTO>[0] | null;
}): AssignmentDTO {
  return {
    id: assignment.id,
    employeeId: assignment.employeeId,
    trainingId: assignment.trainingId,
    status: assignment.status,
    progressPercent: assignment.progressPercent,
    timeWatchedSec: assignment.timeWatchedSec,
    startedAt: toIso(assignment.startedAt),
    completedAt: toIso(assignment.completedAt),
    dueDate: toIso(assignment.dueDate),
    learningSummary: assignment.learningSummary ?? null,
    completionNotes: assignment.completionNotes ?? null,
    reviewStatus: assignment.reviewStatus ?? null,
    reviewedBy: assignment.reviewedBy ?? null,
    reviewedAt: toIso(assignment.reviewedAt),
    reviewNote: assignment.reviewNote ?? null,
    createdAt: toIso(assignment.createdAt)!,
    updatedAt: toIso(assignment.updatedAt)!,
    employee: assignment.employee ? toEmployeeDTO(assignment.employee) : null,
    training: assignment.training ? toTrainingDTO(assignment.training) : null,
  };
}

// ---------------------------------------------------------------------------
// Activity Log DTO
// ---------------------------------------------------------------------------

export type ActivityLogDTO = {
  id: string;
  actorName: string;
  action: string;
  entity: string;
  entityId: string | null;
  createdAt: string;   // ISO string
};

export function toActivityLogDTO(log: {
  id: string;
  actorName: string;
  action: string;
  entity: string;
  entityId?: string | null;
  createdAt: Date;
}): ActivityLogDTO {
  return {
    id: log.id,
    actorName: log.actorName,
    action: log.action,
    entity: log.entity,
    entityId: log.entityId ?? null,
    createdAt: toIso(log.createdAt)!,
  };
}
