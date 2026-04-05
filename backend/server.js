const app = require('./src/app');
const connectDB = require('./src/config/db');
require('dotenv').config();
const cors = require('cors');
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));
const PORT = process.env.PORT || 5000;

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
    console.error(err.name, err.message);
    process.exit(1);
});

// Connect to database and start server
const startServer = async () => {
    try {
        // Connect to MongoDB
        await connectDB();
        
        // Start server
        const server = app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`📡 Environment: ${process.env.NODE_ENV}`);
            console.log(`🔗 API URL: http://localhost:${PORT}/api`);
        });
        
        // Handle unhandled promise rejections
        process.on('unhandledRejection', (err) => {
            console.error('UNHANDLED REJECTION! 💥 Shutting down...');
            console.error(err.name, err.message);
            server.close(() => {
                process.exit(1);
            });
        });
        
        // Graceful shutdown
        process.on('SIGTERM', () => {
            console.log('👋 SIGTERM received. Shutting down gracefully');
            server.close(() => {
                console.log('💥 Process terminated');
            });
        });
        
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();