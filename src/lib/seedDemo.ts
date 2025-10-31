// Seed demo data for Tag Chain application
import { supabase } from './supabaseClient';

async function seedDemoData() {
  console.log('Seeding demo data...');

  // Insert sample users
  const users = [
    {
      email: 'farmer@example.com',
      full_name: 'John Farmer',
      role: 'farmer',
      created_at: new Date().toISOString()
    },
    {
      email: 'vet@example.com',
      full_name: 'Dr. Sarah Vet',
      role: 'veterinarian',
      created_at: new Date().toISOString()
    },
    {
      email: 'abattoir@example.com',
      full_name: 'Premium Abattoir Ltd',
      role: 'abattoir',
      created_at: new Date().toISOString()
    },
    {
      email: 'buyer@example.com',
      full_name: 'Kano Livestock Co.',
      role: 'buyer',
      created_at: new Date().toISOString()
    },
    {
      email: 'transporter@example.com',
      full_name: 'Reliable Transport Ltd',
      role: 'transporter',
      created_at: new Date().toISOString()
    },
    {
      email: 'regulator@example.com',
      full_name: 'Nigerian Livestock Authority',
      role: 'regulator',
      created_at: new Date().toISOString()
    }
  ];

  const { data: userData, error: userError } = await supabase
    .from('users')
    .insert(users);

  if (userError) {
    console.error('Error inserting users:', userError);
  } else {
    console.log('Users inserted successfully');
  }

  // Insert sample animals
  const animals = [
    {
      tag_id: 'TC-001-NG',
      breed: 'White Fulani',
      age: 3,
      weight: 420.5,
      health_status: 'Excellent',
      image_url: 'https://example.com/cattle1.jpg',
      created_at: new Date().toISOString()
    },
    {
      tag_id: 'TC-002-NG',
      breed: 'Sokoto Gudali',
      age: 2,
      weight: 380.2,
      health_status: 'Good',
      image_url: 'https://example.com/cattle2.jpg',
      created_at: new Date().toISOString()
    },
    {
      tag_id: 'TC-003-NG',
      breed: 'Red Bororo',
      age: 4,
      weight: 450.0,
      health_status: 'Excellent',
      image_url: 'https://example.com/cattle3.jpg',
      created_at: new Date().toISOString()
    }
  ];

  const { data: animalData, error: animalError } = await supabase
    .from('animals')
    .insert(animals);

  if (animalError) {
    console.error('Error inserting animals:', animalError);
  } else {
    console.log('Animals inserted successfully');
  }

  // Insert sample alerts
  const alerts = [
    {
      type: 'disease',
      severity: 'high',
      description: 'Lumpy Skin Disease outbreak reported in Kaduna State',
      latitude: 10.5167,
      longitude: 7.4333,
      created_at: new Date().toISOString()
    },
    {
      type: 'weather',
      severity: 'medium',
      description: 'Heatwave warning for Northern regions',
      latitude: 12.0000,
      longitude: 8.5167,
      created_at: new Date().toISOString()
    },
    {
      type: 'market',
      severity: 'low',
      description: 'Cattle prices increased by 15% in major markets',
      latitude: 9.0833,
      longitude: 7.5333,
      created_at: new Date().toISOString()
    }
  ];

  const { data: alertData, error: alertError } = await supabase
    .from('alerts')
    .insert(alerts);

  if (alertError) {
    console.error('Error inserting alerts:', alertError);
  } else {
    console.log('Alerts inserted successfully');
  }

  // Insert sample transactions
  const transactions = [
    {
      buyer_id: 'buyer1',
      seller_id: 'seller1',
      animal_id: 'animal1',
      amount: 850.00,
      currency: 'USDC',
      status: 'released',
      created_at: new Date().toISOString()
    },
    {
      buyer_id: 'buyer2',
      seller_id: 'seller2',
      animal_id: 'animal2',
      amount: 720.00,
      currency: 'USDC',
      status: 'escrow',
      created_at: new Date().toISOString()
    }
  ];

  const { data: transactionData, error: transactionError } = await supabase
    .from('transactions')
    .insert(transactions);

  if (transactionError) {
    console.error('Error inserting transactions:', transactionError);
  } else {
    console.log('Transactions inserted successfully');
  }

  // Insert sample certificates
  const certificates = [
    {
      animal_id: 'animal1',
      cert_type: 'export',
      issued_by: 'regulator1',
      issued_to: 'abattoir1',
      hash: 'a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890',
      approved: true,
      created_at: new Date().toISOString()
    },
    {
      animal_id: 'animal2',
      cert_type: 'halal',
      issued_by: 'regulator1',
      issued_to: 'abattoir2',
      hash: 'f0e9d8c7b6a59483726150493827160594837261504938271605948372615049',
      approved: false,
      created_at: new Date().toISOString()
    }
  ];

  const { data: certificateData, error: certificateError } = await supabase
    .from('certificates')
    .insert(certificates);

  if (certificateError) {
    console.error('Error inserting certificates:', certificateError);
  } else {
    console.log('Certificates inserted successfully');
  }

  console.log('Demo data seeding completed!');
}

// Run the seed function if this file is executed directly
if (typeof window === 'undefined') {
  seedDemoData().catch(console.error);
}

export default seedDemoData;