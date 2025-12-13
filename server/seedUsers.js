import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Student from './models/Student.js';
import Staff from './models/Staff.js';
import HOD from './models/HOD.js';
import connectDB from './config/db.js';

dotenv.config();

const seedUsers = async () => {
  try {
    await connectDB();

    // Clear existing demo users
    await Student.deleteMany({});
    await Staff.deleteMany({});
    await HOD.deleteMany({});

    console.log('🗑️  Cleared existing collections');

    // HOD data
    const hodData = [
      {
        name: 'Dr. Rajesh Kumar',
        email: 'hod.cs@example.com',
        password: 'demo123',
        department: 'Computer Science',
        employeeId: 'HOD001',
        phone: '9876543210'
      },
      {
        name: 'Prof. Priya Sharma',
        email: 'hod.it@example.com',
        password: 'demo123',
        department: 'Information Technology',
        employeeId: 'HOD002',
        phone: '9876543211'
      }
    ];

    // Staff data
    const staffData = [
      {
        name: 'Dr. Arun Singh',
        email: 'arun.singh@example.com',
        password: 'demo123',
        department: 'Computer Science',
        employeeId: 'STAFF001',
        phone: '8765432100'
      },
      {
        name: 'Prof. Neha Verma',
        email: 'neha.verma@example.com',
        password: 'demo123',
        department: 'Computer Science',
        employeeId: 'STAFF002',
        phone: '8765432101'
      },
      {
        name: 'Dr. Rajiv Gupta',
        email: 'rajiv.gupta@example.com',
        password: 'demo123',
        department: 'Computer Science',
        employeeId: 'STAFF003',
        phone: '8765432102'
      },
      {
        name: 'Prof. Sneha Patel',
        email: 'sneha.patel@example.com',
        password: 'demo123',
        department: 'Information Technology',
        employeeId: 'STAFF004',
        phone: '8765432103'
      },
      {
        name: 'Dr. Vikram Reddy',
        email: 'vikram.reddy@example.com',
        password: 'demo123',
        department: 'Information Technology',
        employeeId: 'STAFF005',
        phone: '8765432104'
      }
    ];

    // Student data
    const studentData = [
      {
        name: 'Raj Patel',
        email: 'raj.patel@example.com',
        password: 'demo123',
        department: 'Computer Science',
        studentId: 'CS21001',
        phone: '7654321001'
      },
      {
        name: 'Priya Singh',
        email: 'priya.singh@example.com',
        password: 'demo123',
        department: 'Computer Science',
        studentId: 'CS21002',
        phone: '7654321002'
      },
      {
        name: 'Amit Kumar',
        email: 'amit.kumar@example.com',
        password: 'demo123',
        department: 'Computer Science',
        studentId: 'CS21003',
        phone: '7654321003'
      },
      {
        name: 'Neha Sharma',
        email: 'neha.sharma@example.com',
        password: 'demo123',
        department: 'Computer Science',
        studentId: 'CS21004',
        phone: '7654321004'
      },
      {
        name: 'Rohit Verma',
        email: 'rohit.verma@example.com',
        password: 'demo123',
        department: 'Computer Science',
        studentId: 'CS21005',
        phone: '7654321005'
      },
      {
        name: 'Anjali Joshi',
        email: 'anjali.joshi@example.com',
        password: 'demo123',
        department: 'Computer Science',
        studentId: 'CS21006',
        phone: '7654321006'
      },
      {
        name: 'Vikram Singh',
        email: 'vikram.singh@example.com',
        password: 'demo123',
        department: 'Computer Science',
        studentId: 'CS21007',
        phone: '7654321007'
      },
      {
        name: 'Disha Pandey',
        email: 'disha.pandey@example.com',
        password: 'demo123',
        department: 'Computer Science',
        studentId: 'CS21008',
        phone: '7654321008'
      },
      {
        name: 'Arjun Rao',
        email: 'arjun.rao@example.com',
        password: 'demo123',
        department: 'Computer Science',
        studentId: 'CS21009',
        phone: '7654321009'
      },
      {
        name: 'Meera Reddy',
        email: 'meera.reddy@example.com',
        password: 'demo123',
        department: 'Computer Science',
        studentId: 'CS21010',
        phone: '7654321010'
      },
      {
        name: 'Saurav Kumar',
        email: 'saurav.kumar@example.com',
        password: 'demo123',
        department: 'Information Technology',
        studentId: 'IT21001',
        phone: '7654321011'
      },
      {
        name: 'Aisha Khan',
        email: 'aisha.khan@example.com',
        password: 'demo123',
        department: 'Information Technology',
        studentId: 'IT21002',
        phone: '7654321012'
      },
      {
        name: 'Nikhil Desai',
        email: 'nikhil.desai@example.com',
        password: 'demo123',
        department: 'Information Technology',
        studentId: 'IT21003',
        phone: '7654321013'
      },
      {
        name: 'Pooja Yadav',
        email: 'pooja.yadav@example.com',
        password: 'demo123',
        department: 'Information Technology',
        studentId: 'IT21004',
        phone: '7654321014'
      },
      {
        name: 'Rishabh Singh',
        email: 'rishabh.singh@example.com',
        password: 'demo123',
        department: 'Information Technology',
        studentId: 'IT21005',
        phone: '7654321015'
      }
    ];

    // Create HOD users - using create() triggers pre-save
    const hodUsers = [];
    for (const data of hodData) {
      const hod = new HOD(data);
      await hod.save();
      hodUsers.push(hod);
    }

    console.log(`✅ Created ${hodUsers.length} HOD users`);

    // Create Staff users - using create() triggers pre-save
    const staffUsers = [];
    for (const data of staffData) {
      const staff = new Staff(data);
      await staff.save();
      staffUsers.push(staff);
    }

    console.log(`✅ Created ${staffUsers.length} Staff users`);

    // Create Student users - using create() triggers pre-save
    const studentUsers = [];
    for (const data of studentData) {
      const student = new Student(data);
      await student.save();
      studentUsers.push(student);
    }

    console.log(`✅ Created ${studentUsers.length} Student users`);

    console.log('\n' + '='.repeat(50));
    console.log('✅ Demo data seeded successfully!');
    console.log('='.repeat(50));

    console.log('\n📋 HOD Accounts:');
    console.log('─'.repeat(50));
    hodUsers.forEach(user => {
      console.log(`  ${user.name}`);
      console.log(`    Email: ${user.email}`);
      console.log(`    Password: demo123`);
      console.log(`    Department: ${user.department}`);
      console.log('');
    });

    console.log('\n👨‍🏫 Staff Accounts:');
    console.log('─'.repeat(50));
    staffUsers.forEach(user => {
      console.log(`  ${user.name}`);
      console.log(`    Email: ${user.email}`);
      console.log(`    Password: demo123`);
      console.log(`    Department: ${user.department}`);
      console.log('');
    });

    console.log('\n👨‍🎓 Student Accounts:');
    console.log('─'.repeat(50));
    studentUsers.forEach(user => {
      console.log(`  ${user.name}`);
      console.log(`    Email: ${user.email}`);
      console.log(`    Password: demo123`);
      console.log(`    Student ID: ${user.studentId}`);
      console.log('');
    });

    console.log('='.repeat(50));
    console.log(`\n📊 Summary:`);
    console.log(`  • HOD Users: ${hodUsers.length}`);
    console.log(`  • Staff Users: ${staffUsers.length}`);
    console.log(`  • Student Users: ${studentUsers.length}`);
    console.log(`  • Total Users: ${hodUsers.length + staffUsers.length + studentUsers.length}`);
    console.log('='.repeat(50));

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedUsers();
