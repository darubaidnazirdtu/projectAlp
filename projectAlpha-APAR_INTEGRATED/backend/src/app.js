import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
//import multer from 'multer'
import { errorHandler } from './middlewares/error.middleware.js'
import { authenticate, createRouteGuard } from './middlewares/auth.middleware.js'

const app = express()
//const upload = multer()

app.set('trust proxy', 1);

app.use(express.json({
    limit: '50mb'
}))

app.use(express.urlencoded({
    extended: true,
    limit: '50mb'
}))

//app.use(upload.any())

app.use(express.static('public'))

const rawOrigins = process.env.ORIGIN ? process.env.ORIGIN.split(',').map((value) => value.trim()).filter(Boolean) : []
const allowedOrigins = rawOrigins.length > 0 ? rawOrigins : undefined

app.use(cors({
    origin: (origin, callback) => {
        if (!origin) {
            callback(null, true)
            return
        }

        if (!allowedOrigins || allowedOrigins.includes(origin)) {
            callback(null, true)
            return
        }

        callback(new Error(`Origin ${origin} not allowed by CORS`))
    },
    credentials: true
}))

app.use(cookieParser())

// Global Middleware: Normalize Academic Year (AY) formats
// Ensures '2026-2027' becomes '2026-27' across all IQAC and APAR endpoints.
app.use((req, res, next) => {
    const normalizeAY = (ay) => {
        if (!ay || typeof ay !== 'string') return ay;
        const cleanAy = ay.trim();
        const parts = cleanAy.split(/[\s-]+/);
        if (parts.length === 2 && parts[0].length === 4 && parts[1].length === 4) {
            // e.g. 2026-2027 -> 2026-27
            return `${parts[0]}-${parts[1].substring(2)}`;
        }
        return cleanAy;
    };

    const recursiveNormalize = (obj) => {
        if (typeof obj !== 'object' || obj === null) return;
        // Avoid deep recursion on circular structures or huge buffers if any, 
        // but explicit JSON body is safe usually.
        for (const key in obj) {
            if ((key === 'ay' || key === 'academic_year') && typeof obj[key] === 'string') {
                obj[key] = normalizeAY(obj[key]);
            } else if (typeof obj[key] === 'object') {
                recursiveNormalize(obj[key]);
            }
        }
    };

    try {
        if (req.body) recursiveNormalize(req.body);
        if (req.query) recursiveNormalize(req.query);
    } catch (e) {
        console.error("AY Normalization Middleware Error:", e);
    }
    next();
});

import authRoutes from "./routes/auth.routes.js"
import aparAuthRoutes from "./routes/apar.auth.routes.js"
import departmentRoutes from "./routes/departments.routes.js"
import programmesRoutes from "./routes/programmes.routes.js"
import facultyRoutes from "./routes/faculty.routes.js"
import studentsRoutes from "./routes/students.routes.js"
import coursesRoutes from "./routes/courses.routes.js"
import programmesWithFieldResearchRoutes from "./routes/programmes_with_field_research.routes.js"
import booksChaptersPublishedRoutes from "./routes/books_chapters_published.routes.js"
import financialSupportEventsRoutes from "./routes/financial_support_events.routes.js"
import itInfrastructureStockRoutes from "./routes/it_infrastructure_stock.routes.js"
import teachersUsingIctRoutes from "./routes/teachers_using_ict.routes.js"
import facultyDevelopmentProgramsRoutes from "./routes/faculty_development_programs.routes.js"
import facultyVisitsRoutes from "./routes/faculty_visits.routes.js"
import professionalAffiliationsRoutes from "./routes/professional_affiliations.routes.js"
import studentCentricMethodsRoutes from "./routes/student_centric_methods.routes.js"
import mentorsStressSupportRoutes from "./routes/mentors_stress_support.routes.js"
import researchInnovationAwardsRoutes from "./routes/research_innovation_awards.routes.js"
import deptProfessionalSchemesRoutes from "./routes/dept_professional_schemes.routes.js"
import researchFundingRoutes from "./routes/research_funding.routes.js"
import revenueFromConsultancyRoutes from "./routes/revenue_from_consultancy.routes.js"
import revenueFromCorporateTrainingRoutes from "./routes/revenue_from_corporate_training.routes.js"
import collaborativeActivitiesRoutes from "./routes/collaborative_activities.routes.js"
import collaborativeResearchExchangeRoutes from "./routes/collaborative_research_exchange.routes.js"
import functionalMousRoutes from "./routes/functional_mous.routes.js"
import eContentDevelopedRoutes from "./routes/e_content_developed.routes.js"
import capabilityEnhancementSchemesRoutes from "./routes/capability_enhancement_schemes.routes.js"
import studentsHigherEducationRoutes from "./routes/students_higher_education.routes.js"
import studentsCompetitiveExamsRoutes from "./routes/students_competitive_exams.routes.js"
import studentPerformanceActivitiesRoutes from "./routes/student_performance_activities.routes.js"
import studentFinancialSupportEventsRoutes from "./routes/student_financial_support_events.routes.js"
import professionalTrainingStaffRoutes from "./routes/professional_training_staff.routes.js"
import staffTrainingRoutes from "./routes/staff_training.routes.js"
import extensionOutreachActivitiesRoutes from "./routes/extension_outreach_activities.routes.js"
import deptLibraryBooksRoutes from "./routes/dept_library_books.routes.js"
import phdDefenceRoutes from "./routes/phd_defence.routes.js"
import patentsRoutes from "./routes/patents.routes.js"
import journalResearchPapersRoutes from "./routes/journal_research_papers.routes.js"
import conferenceResearchPapersRoutes from "./routes/conference_research_papers.routes.js"
import feedbackRoutes from "./routes/feedback.routes.js"
import uploadRoutes from "./routes/upload.routes.js"
import notificationRoutes from "./routes/notification.routes.js"
import dashboardRoutes from "./routes/dashboard.routes.js"
import userManagementRoutes from "./routes/user_management.routes.js"

import aparMongoRoutes from "./routes/apar.mongo.routes.js"

// ...

app.use('/api/v1/apar/mongo', authenticate, aparMongoRoutes)


const registerProtectedRoute = (path, router) => {
    // console.log(`[app] registering protected route: ${path}`)
    app.use(path, authenticate, createRouteGuard(path), router)
}

app.use('/api/v1/auth', authRoutes)
app.use('/api/v1/feedback', feedbackRoutes)
app.use('/api/v1/apar/auth', aparAuthRoutes)
app.use('/api/v1/upload', uploadRoutes)
app.use('/api/v1/notifications', notificationRoutes)
app.use('/api/v1/dashboard', dashboardRoutes)

// legacy APAR endpoints (compatibility with older frontends)
// app.use('/', authenticate, legacyAparRoutes)

registerProtectedRoute("/api/v1/departments", departmentRoutes)
registerProtectedRoute("/api/v1/programmes", programmesRoutes)
registerProtectedRoute("/api/v1/faculty", facultyRoutes)
registerProtectedRoute("/api/v1/students", studentsRoutes)
registerProtectedRoute("/api/v1/courses", coursesRoutes)
registerProtectedRoute("/api/v1/programmes_with_field_research", programmesWithFieldResearchRoutes)
registerProtectedRoute("/api/v1/books_chapters_published", booksChaptersPublishedRoutes)
registerProtectedRoute("/api/v1/financial_support_events", financialSupportEventsRoutes)
registerProtectedRoute("/api/v1/it_infrastructure_stock", itInfrastructureStockRoutes)
registerProtectedRoute("/api/v1/teachers_using_ict", teachersUsingIctRoutes)
registerProtectedRoute("/api/v1/faculty_development_programs", facultyDevelopmentProgramsRoutes)
registerProtectedRoute("/api/v1/faculty_visits", facultyVisitsRoutes)
registerProtectedRoute("/api/v1/professional_affiliations", professionalAffiliationsRoutes)
registerProtectedRoute("/api/v1/student_centric_method", studentCentricMethodsRoutes)
registerProtectedRoute("/api/v1/mentors_stress_support", mentorsStressSupportRoutes)
registerProtectedRoute("/api/v1/research_innovation_awards", researchInnovationAwardsRoutes)
registerProtectedRoute("/api/v1/dept_professional_schemes", deptProfessionalSchemesRoutes)
registerProtectedRoute("/api/v1/research_funding", researchFundingRoutes)
registerProtectedRoute("/api/v1/revenue_from_consultancy", revenueFromConsultancyRoutes)
registerProtectedRoute("/api/v1/revenue_from_corporate_training", revenueFromCorporateTrainingRoutes)
registerProtectedRoute("/api/v1/collaborative_activities", collaborativeActivitiesRoutes)
registerProtectedRoute("/api/v1/collaborative_research_exchange", collaborativeResearchExchangeRoutes)
registerProtectedRoute("/api/v1/functional_mous", functionalMousRoutes)
registerProtectedRoute("/api/v1/e_content_developed", eContentDevelopedRoutes)
registerProtectedRoute("/api/v1/capability_enhancement_schemes", capabilityEnhancementSchemesRoutes)
registerProtectedRoute("/api/v1/students_higher_education", studentsHigherEducationRoutes)
registerProtectedRoute("/api/v1/students_competitive_exams", studentsCompetitiveExamsRoutes)
registerProtectedRoute("/api/v1/student_performance_activities", studentPerformanceActivitiesRoutes)
registerProtectedRoute("/api/v1/student_financial_support_events", studentFinancialSupportEventsRoutes)
registerProtectedRoute("/api/v1/professional_training_staff", professionalTrainingStaffRoutes)
registerProtectedRoute("/api/v1/staff_training", staffTrainingRoutes)
registerProtectedRoute("/api/v1/extension_outreach_activities", extensionOutreachActivitiesRoutes)
registerProtectedRoute("/api/v1/dept_library_books", deptLibraryBooksRoutes)
registerProtectedRoute("/api/v1/phd_defence", phdDefenceRoutes)
registerProtectedRoute("/api/v1/patents", patentsRoutes)
registerProtectedRoute("/api/v1/journal_research_papers", journalResearchPapersRoutes)
registerProtectedRoute("/api/v1/conference_research_papers", conferenceResearchPapersRoutes)
registerProtectedRoute("/api/v1/auth/admin/users", userManagementRoutes)



app.use(errorHandler)

export {
    app
}