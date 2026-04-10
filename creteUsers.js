import dotenv from 'dotenv'
import mongoose from 'mongoose'
import User from './models/User.js'

dotenv.config()

const createUsers = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('Connected to MongoDB')

    // Check if users already exist
    const userCount = await User.countDocuments()
    if (userCount > 0) {
      console.log('Users already exist. Dropping existing users...')
      await User.deleteMany({})
    }

    // Create users
    const sender = new User({
      role: 'sender',
      password: 'sender123',
    })

    const collector = new User({
      role: 'collector',
      password: 'collector123',
    })

    await sender.save()
    await collector.save()

    console.log('✅ Users created successfully!')
    console.log('Sender password: sender123')
    console.log('Collector password: collector123')

    process.exit(0)
  } catch (error) {
    console.error('Error creating users:', error)
    process.exit(1)
  }
}

createUsers()
