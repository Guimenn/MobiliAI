-- CreateEnum para MedicalCertificateType
CREATE TYPE "MedicalCertificateType" AS ENUM ('MEDICAL', 'DENTAL', 'PSYCHOLOGICAL', 'OTHER');

-- CreateEnum para MedicalCertificateStatus
CREATE TYPE "MedicalCertificateStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "medical_certificates" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "type" "MedicalCertificateType" NOT NULL,
    "reason" TEXT NOT NULL,
    "doctorName" TEXT NOT NULL,
    "doctorCrm" TEXT NOT NULL,
    "clinicName" TEXT NOT NULL,
    "status" "MedicalCertificateStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "attachmentUrl" TEXT,
    "registeredById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "medical_certificates_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "medical_certificates" ADD CONSTRAINT "medical_certificates_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medical_certificates" ADD CONSTRAINT "medical_certificates_registeredById_fkey" FOREIGN KEY ("registeredById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


