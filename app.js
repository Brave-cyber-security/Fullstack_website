import compression from 'compression'
import MongoStore from 'connect-mongo'
import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import session from 'express-session'
import helmet from 'helmet'
import methodOverride from 'method-override'
import mongoose from 'mongoose'
import morgan from 'morgan'
import path from 'path'
import { fileURLToPath } from 'url'

// Import routes
import { adminRoutes } from './routes/admin.js'
import { authRoutes } from './routes/auth.js'
import { customerRoutes } from './routes/customer.js'
import { guestRoutes } from './routes/guest.js'
import { knowledgeBaseRoutes } from './routes/knowledgeBase.js'
import { masterRoutes } from './routes/master.js'
import { sendTestEmail, testEmailConnection } from './utils/emailService..js'

// Load environment variables
dotenv.config()

// Get directory name for ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const port = process.env.PORT || 3000

// Security middleware
app.use(
	helmet({
		contentSecurityPolicy: {
			directives: {
				defaultSrc: ["'self'"],
				styleSrc: [
					"'self'",
					"'unsafe-inline'",
					'https://stackpath.bootstrapcdn.com',
					'https://cdnjs.cloudflare.com',
				],
				scriptSrc: ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net'],
				imgSrc: ["'self'", 'data:', 'https:', 'http:'],
				fontSrc: ["'self'", 'https://cdnjs.cloudflare.com'],
			},
		},
	})
)

// Compression middleware
app.use(compression())

// Logging middleware
if (process.env.NODE_ENV !== 'production') {
	app.use(morgan('dev'))
}

// CORS middleware
app.use(
	cors({
		origin: process.env.FRONTEND_URL || 'http://localhost:3000',
		credentials: true,
	})
)

// Body parsing middleware
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Method override middleware
app.use(methodOverride('_method'))

// Static files
app.use(express.static(path.join(__dirname, 'public')))

// View engine setup
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))

// Database connection
const connectDB = async () => {
	try {
		const mongoURI =
			process.env.MONGODB_URI || 'mongodb://localhost:27017/dern_support'
		await mongoose.connect(mongoURI)
		console.log('✅ Connected to MongoDB')
	} catch (error) {
		console.error('❌ MongoDB connection error:', error)
		process.exit(1)
	}
}

// Connect to database
connectDB()

// Session configuration
app.use(
	session({
		secret:
			process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
		resave: false,
		saveUninitialized: false,
		store: MongoStore.create({
			mongoUrl:
				process.env.MONGODB_URI || 'mongodb://localhost:27017/dern_support',
			touchAfter: 24 * 3600, // lazy session update
		}),
		cookie: {
			secure: process.env.NODE_ENV === 'production',
			httpOnly: true,
			maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
		},
	})
)

// Global middleware to set user context
app.use((req, res, next) => {
	res.locals.currentUser = req.session.user || null
	res.locals.isAdmin = req.session.isAdmin || false
	res.locals.isMaster = req.session.isMaster || false
	next()
})

// Main routes (must come before other routes)
app.get('/', (req, res) => {
	res.render('index')
})

// Authentication routes (login/signup pages and form submissions)
app.get('/login', (req, res) => {
	res.render('auth/login')
})

app.get('/signup', (req, res) => {
	res.render('auth/signup')
})

app.get('/logout', (req, res) => {
	req.session.destroy(err => {
		if (err) {
			console.error('Logout error:', err)
			return res.status(500).render('error', { error: 'Logout failed' })
		}
		res.redirect('/')
	})
})

// Email testing routes (for development only)
app.get('/test-email-connection', async (req, res) => {
	if (process.env.NODE_ENV === 'production') {
		return res.status(403).send('Email testing not allowed in production')
	}

	try {
		const result = await testEmailConnection()
		res.json(result)
	} catch (error) {
		res.status(500).json({ success: false, error: error.message })
	}
})

app.get('/test-email/:email', async (req, res) => {
	if (process.env.NODE_ENV === 'production') {
		return res.status(403).send('Email testing not allowed in production')
	}

	try {
		const result = await sendTestEmail(req.params.email)
		res.json(result)
	} catch (error) {
		res.status(500).json({ success: false, error: error.message })
	}
})

// Add a seed route for development
app.get('/seed', async (req, res) => {
	if (process.env.NODE_ENV === 'production') {
		return res.status(403).send('Seeding not allowed in production')
	}

	try {
		// Import and run seed function
		const { execSync } = await import('child_process')
		execSync('node seed/seed.js', { stdio: 'inherit' })
		res.send(`
      <h1>Database seeded successfully!</h1>
      <p>Test accounts created:</p>
      <ul>
        <li><strong>Master:</strong> master@dern-support.com / master123</li>
        <li><strong>Admin:</strong> admin@dern-support.com / admin123</li>
        <li><strong>Customer:</strong> customer@example.com / customer123</li>
      </ul>
      <a href="/">Go to homepage</a>
    `)
	} catch (error) {
		console.error('Seed error:', error)
		res.status(500).send(`Seeding failed: ${error.message}`)
	}
})

// Mount route modules
app.use('/', authRoutes) // This handles POST /login, POST /signup
app.use('/', guestRoutes) // This handles /guest-support
app.use('/admin', adminRoutes)
app.use('/knowledge', knowledgeBaseRoutes)
app.use('/master', masterRoutes)
app.use('/customer', customerRoutes)

// 404 handler
app.use((req, res) => {
	res.status(404).render('404')
})

// Error handler
app.use((err, req, res, next) => {
	console.error('Error:', err)
	res.status(500).render('error', {
		error:
			process.env.NODE_ENV === 'production'
				? 'Something went wrong!'
				: err.message,
	})
})

// Start server
app.listen(port, () => {
	console.log(`🚀 Dern-Support server running on port ${port}`)
	console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`)
	console.log(`🌐 Access the application at: http://localhost:${port}`)

	// Test email connection on startup
	testEmailConnection().then(result => {
		if (result.success) {
			console.log('✅ Email service ready')
		} else {
			console.log('❌ Email service not configured:', result.error)
		}
	})
})

// Graceful shutdown
process.on('SIGTERM', () => {
	console.log('SIGTERM received. Shutting down gracefully...')
	mongoose.connection.close(() => {
		console.log('MongoDB connection closed.')
		process.exit(0)
	})
})
