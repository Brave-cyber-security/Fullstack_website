import mongoose from "mongoose"
import bcrypt from "bcryptjs"
import dotenv from "dotenv"
import User from "../models/User.js"
import PricingRule from "../models/PricingRule.js"
import KnowledgeBase from "../models/KnowledgeBase.js"
import SparePart from "../models/SparePart.js"

// Load environment variables
dotenv.config()

async function seed() {
  try {
    // Connect to MongoDB
    const mongoURI = process.env.MONGODB_URI || "mongodb://localhost:27017/dern_support"
    await mongoose.connect(mongoURI)
    console.log("✅ Connected to MongoDB")

    // Clear existing data (optional, but useful for development)
    await User.deleteMany({})
    await PricingRule.deleteMany({})
    await KnowledgeBase.deleteMany({})
    await SparePart.deleteMany({})
    console.log("🗑️  Cleared existing data")

    // Create admin user
    const adminPassword = await bcrypt.hash("admin123", 10)
    const admin = new User({
      email: "admin@dern-support.com",
      password: adminPassword,
      firstName: "Admin",
      lastName: "User",
      accountType: "individual",
      phone: "555-123-4567",
      address: {
        street: "123 Main St",
        city: "Anytown",
        state: "CA",
        zipCode: "91234",
        country: "USA",
      },
      isAdmin: true,
    })

    await admin.save()
    console.log("👤 Created admin user")

    // Create master user
    const masterPassword = await bcrypt.hash("master123", 10)
    const master = new User({
      email: "master@dern-support.com",
      password: masterPassword,
      firstName: "Master",
      lastName: "User",
      accountType: "business",
      businessName: "Dern-Support Management",
      phone: "555-987-6543",
      address: {
        street: "123 Tech St",
        city: "Silicon Valley",
        state: "CA",
        zipCode: "94000",
        country: "USA",
      },
      isMaster: true,
    })

    await master.save()
    console.log("👑 Created master user")

    // Create sample customer
    const customerPassword = await bcrypt.hash("customer123", 10)
    const customer = new User({
      email: "customer@example.com",
      password: customerPassword,
      firstName: "John",
      lastName: "Doe",
      accountType: "individual",
      phone: "555-555-5555",
      address: {
        street: "456 Customer Ave",
        city: "Customer City",
        state: "CA",
        zipCode: "90210",
        country: "USA",
      },
    })

    await customer.save()
    console.log("👤 Created sample customer")

    // Add some sample pricing rules
    const pricingRules = [
      {
        name: "Standard Desktop Repair",
        description: "Standard pricing for desktop computer repairs",
        deviceType: "desktop",
        urgencyLevel: "medium",
        basePrice: 75,
        multiplier: 1.25,
        createdBy: master._id,
      },
      {
        name: "Critical Server Issues",
        description: "Emergency pricing for critical server problems",
        deviceType: "server",
        urgencyLevel: "critical",
        basePrice: 150,
        multiplier: 2.5,
        createdBy: master._id,
      },
      {
        name: "Mobile Device Standard",
        description: "Standard pricing for smartphone and tablet repairs",
        deviceType: "smartphone",
        urgencyLevel: "all",
        basePrice: 60,
        multiplier: 1,
        createdBy: master._id,
      },
      {
        name: "Laptop High Priority",
        description: "High priority laptop repairs",
        deviceType: "laptop",
        urgencyLevel: "high",
        basePrice: 85,
        multiplier: 1.75,
        createdBy: master._id,
      },
      {
        name: "Network Emergency",
        description: "Critical network infrastructure issues",
        deviceType: "network",
        urgencyLevel: "critical",
        basePrice: 100,
        multiplier: 3,
        createdBy: master._id,
      },
    ]

    await PricingRule.insertMany(pricingRules)
    console.log("💰 Created sample pricing rules")

    // Add sample spare parts
    const spareParts = [
      {
        name: "DDR4 16GB RAM",
        description: "High-performance DDR4 memory module",
        category: "memory",
        compatibleDevices: ["desktop", "laptop"],
        stockQuantity: 25,
        price: 89.99,
        supplier: {
          name: "TechParts Inc",
          contactInfo: "orders@techparts.com",
        },
        location: "Shelf A1",
        minimumStockLevel: 5,
      },
      {
        name: "1TB SSD",
        description: "Solid State Drive for fast storage",
        category: "storage",
        compatibleDevices: ["desktop", "laptop"],
        stockQuantity: 15,
        price: 129.99,
        supplier: {
          name: "Storage Solutions",
          contactInfo: "sales@storagesolutions.com",
        },
        location: "Shelf B2",
        minimumStockLevel: 3,
      },
      {
        name: 'Laptop Screen 15.6"',
        description: "Replacement LCD screen for laptops",
        category: "display",
        compatibleDevices: ["laptop"],
        stockQuantity: 8,
        price: 199.99,
        supplier: {
          name: "Display Direct",
          contactInfo: "support@displaydirect.com",
        },
        location: "Shelf C3",
        minimumStockLevel: 2,
      },
      {
        name: "Wireless Router",
        description: "High-speed wireless router",
        category: "network",
        compatibleDevices: ["network"],
        stockQuantity: 12,
        price: 79.99,
        supplier: {
          name: "Network Gear Co",
          contactInfo: "orders@networkgear.com",
        },
        location: "Shelf D1",
        minimumStockLevel: 3,
      },
    ]

    await SparePart.insertMany(spareParts)
    console.log("🔧 Created sample spare parts")

    // Add sample knowledge base articles
    const knowledgeArticles = [
      {
        title: "How to Fix Slow Computer Performance",
        content: `# How to Fix Slow Computer Performance

A slow computer can be frustrating, but there are several steps you can take to improve performance:

## 1. Check for Malware
Run a full system scan with your antivirus software to detect and remove any malware.

## 2. Clean Up Disk Space
- Delete temporary files
- Empty the recycle bin
- Uninstall unused programs
- Use disk cleanup tools

## 3. Update Your Software
Keep your operating system and software up to date with the latest patches and updates.

## 4. Check Available RAM
If your computer is using most of its RAM, consider upgrading or closing unnecessary programs.

## 5. Restart Regularly
Restart your computer at least once a week to clear memory and install updates.

If these steps don't help, contact our support team for professional assistance.`,
        deviceTypes: ["desktop", "laptop"],
        category: "troubleshooting",
        tags: ["performance", "slow", "optimization"],
        author: admin._id,
        viewCount: 0,
        helpfulCount: 0,
        notHelpfulCount: 0,
        isPublished: true,
      },
      {
        title: "Setting Up a Secure Wi-Fi Network",
        content: `# Setting Up a Secure Wi-Fi Network

Follow these steps to set up a secure wireless network:

## 1. Change Default Passwords
Always change the default admin password on your router.

## 2. Use WPA3 Security
Enable WPA3 encryption (or WPA2 if WPA3 isn't available).

## 3. Create a Strong Network Password
Use a complex password with at least 12 characters.

## 4. Hide Your Network Name (Optional)
You can hide your SSID for additional security.

## 5. Enable Firewall
Make sure your router's firewall is enabled.

## 6. Regular Updates
Keep your router firmware updated.

For professional network setup, contact our team.`,
        deviceTypes: ["network"],
        category: "network",
        tags: ["wifi", "security", "router", "setup"],
        author: admin._id,
        viewCount: 0,
        helpfulCount: 0,
        notHelpfulCount: 0,
        isPublished: true,
      },
    ]

    await KnowledgeBase.insertMany(knowledgeArticles)
    console.log("📚 Created sample knowledge base articles")

    console.log("\n🎉 Seeding completed successfully!")
    console.log("\n📋 Test Accounts Created:")
    console.log("👑 Master: master@dern-support.com / master123")
    console.log("👤 Admin: admin@dern-support.com / admin123")
    console.log("👤 Customer: customer@example.com / customer123")
  } catch (error) {
    console.error("❌ Error seeding database:", error)
  } finally {
    mongoose.disconnect()
    console.log("🔌 Disconnected from MongoDB")
  }
}

seed()
