import { PrismaClient, Priority, Role, AssetType, AssignmentStatus, Employee } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const thumbnails = [
  "https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1556761175-b413da4baf72?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1497366811353-6870744d04b2?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1551836022-d5d88e9218df?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1563986768494-4dee2763ff3f?q=80&w=1200&auto=format&fit=crop"
];

async function main() {
  const adminPassword = await bcrypt.hash("admin", 12);
  const employeePassword = await bcrypt.hash("Password123!", 12);

  const admin = await prisma.user.upsert({
    where: { username: "admin" },
    update: {
      passwordHash: adminPassword,
      isActive: true,
      mustChangePassword: true
    },
    create: {
      username: "admin",
      email: "admin@company.local",
      passwordHash: adminPassword,
      role: Role.ADMIN,
      mustChangePassword: true
    }
  });

  const departments = await Promise.all(
    [
      ["Operations", "Frontline operations and compliance", "#14b8a6"],
      ["People", "HR, onboarding, and employee experience", "#f97316"],
      ["Finance", "Finance, audit, and controls", "#2563eb"],
      ["Security", "Safety, cybersecurity, and incident readiness", "#ef4444"]
    ].map(([name, description, color]) =>
      prisma.department.upsert({
        where: { name },
        update: { description, color },
        create: { name, description, color, managerName: `${name} Lead` }
      })
    )
  );

  const employeesInput = [
    ["EMP-1001", "Maya Hassan", "Operations", "Operations Specialist", "maya.hassan@company.local"],
    ["EMP-1002", "Omar Saleh", "Finance", "Finance Analyst", "omar.saleh@company.local"],
    ["EMP-1003", "Lina Nabil", "People", "People Partner", "lina.nabil@company.local"],
    ["EMP-1004", "Adam Farouk", "Security", "Security Coordinator", "adam.farouk@company.local"],
    ["EMP-1005", "Nour Kamal", "Operations", "Training Champion", "nour.kamal@company.local"]
  ];

  const employees: Employee[] = [];
  for (const [employeeCode, fullName, departmentName, jobTitle, email] of employeesInput) {
    const user = await prisma.user.upsert({
      where: { employeeId: employeeCode },
      update: {},
      create: {
        employeeId: employeeCode,
        email,
        username: employeeCode.toLowerCase(),
        passwordHash: employeePassword,
        role: Role.EMPLOYEE
      }
    });

    const department = departments.find((item) => item.name === departmentName);
    const seededEmp = await prisma.employee.upsert({
      where: { employeeCode },
      update: { departmentId: department?.id },
      create: {
        userId: user.id,
        departmentId: department?.id,
        employeeCode,
        fullName,
        jobTitle,
        manager: department?.managerName,
        phone: "+20 100 000 0000",
        nationalId: `${Math.floor(10000000000000 + Math.random() * 89999999999999)}`,
        joiningDate: new Date(2025, employees.length % 11, 1 + employees.length),
        birthDate: new Date(1990 + employees.length, employees.length % 12, 15),
        gender: employees.length % 2 === 0 ? "FEMALE" : "MALE",
        address: "Cairo, Egypt",
        emergencyContact: "+20 122 000 0000",
        notes: "Seeded employee profile with learning analytics.",
        photoUrl: `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(fullName)}`,
        xp: 240 + employees.length * 80,
        level: 2 + (employees.length % 4),
        streakDays: employees.length + 2
      }
    });
    employees.push(seededEmp);
  }

  const trainingsInput = [
    {
      title: "Workplace Safety Essentials",
      category: "Compliance",
      priority: Priority.CRITICAL,
      estimatedMinutes: 42,
      tags: ["safety", "compliance", "mandatory"],
      description: "Core safety procedures, emergency response, reporting workflows, and hazard prevention."
    },
    {
      title: "Data Privacy and Secure Handling",
      category: "Security",
      priority: Priority.HIGH,
      estimatedMinutes: 55,
      tags: ["privacy", "security", "gdpr"],
      description: "Protect customer and employee data with secure handling, access controls, and incident response."
    },
    {
      title: "Customer Experience Masterclass",
      category: "Service",
      priority: Priority.MEDIUM,
      estimatedMinutes: 38,
      tags: ["customer", "communication"],
      description: "Practical customer communication patterns, escalation etiquette, and experience standards."
    },
    {
      title: "Manager Readiness Path",
      category: "Leadership",
      priority: Priority.HIGH,
      estimatedMinutes: 68,
      tags: ["leadership", "coaching", "feedback"],
      description: "Build coaching rituals, delegation habits, and high-trust feedback loops for new managers."
    },
    {
      title: "Cybersecurity Awareness Basics",
      category: "Security",
      priority: Priority.CRITICAL,
      estimatedMinutes: 36,
      tags: ["security", "phishing", "passwords"],
      description: "Recognize phishing attempts, protect credentials, and report suspicious activity quickly."
    }
  ];

  const trainings = [];
  for (const [index, trainingData] of trainingsInput.entries()) {
    const training = await prisma.training.upsert({
      where: { id: `seed-training-${index + 1}` },
      update: {},
      create: {
        id: `seed-training-${index + 1}`,
        ...trainingData,
        difficulty: index > 1 ? "INTERMEDIATE" : "BEGINNER",
        dueDate: new Date(Date.now() + (index + 5) * 24 * 60 * 60 * 1000),
        thumbnailUrl: thumbnails[index],
        status: "PUBLISHED",
        completionCriteria: "PASS_ACKNOWLEDGEMENT"
      }
    });

    await prisma.trainingAsset.deleteMany({ where: { trainingId: training.id } });
    await prisma.trainingAsset.createMany({
      data: [
        {
          trainingId: training.id,
          type: index % 2 === 0 ? AssetType.VIDEO_YOUTUBE : AssetType.VIDEO_EXTERNAL,
          title: `${training.title} video briefing`,
          url: index % 2 === 0 ? "https://www.youtube.com/embed/ysz5S6PUM-U" : "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
          durationSeconds: training.estimatedMinutes * 60,
          sortOrder: 1
        },
        {
          trainingId: training.id,
          type: AssetType.PDF,
          title: `${training.title} handbook`,
          url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
          fileName: "handbook.pdf",
          mimeType: "application/pdf",
          sortOrder: 2
        }
      ],
      skipDuplicates: true
    });
    trainings.push(training);
  }

  for (const [employeeIndex, employee] of employees.entries()) {
    for (const [trainingIndex, training] of trainings.entries()) {
      if ((employeeIndex + trainingIndex) % 2 === 0 || trainingIndex === 0) {
        const progress = Math.min(100, 20 + employeeIndex * 12 + trainingIndex * 9);
        const completed = progress >= 95;
        await prisma.assignment.upsert({
          where: { employeeId_trainingId: { employeeId: employee.id, trainingId: training.id } },
          update: {},
          create: {
            employeeId: employee.id,
            trainingId: training.id,
            assignedById: admin.id,
            status: completed ? AssignmentStatus.COMPLETED_ON_TIME : progress > 0 ? AssignmentStatus.IN_PROGRESS : AssignmentStatus.NOT_STARTED,
            progressPercent: progress,
            timeWatchedSec: Math.round((training.estimatedMinutes * 60 * progress) / 100),
            startedAt: progress > 0 ? new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) : null,
            completedAt: completed ? new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) : null,
            dueDate: training.dueDate,
            learningSummary: completed ? "I learned key training concepts and safety guidelines during this course." : null,
            reviewStatus: completed ? "PENDING_REVIEW" : null
          }
        });
      }
    }
  }

  await prisma.activityLog.create({
    data: {
      userId: admin.id,
      actorName: "System",
      action: "seed.completed",
      entity: "Database",
      metadata: { employees: employees.length, trainings: trainings.length }
    }
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
