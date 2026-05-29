import { createEmergencySkill, createEmergencyTool } from '../src/lib/server/organization/emergency-registry.js';

console.log('Seeding emergency registry...');

// Emergency Skills
const skills = [
	// Medical
	{ name: 'First Aid', category: 'Medical', description: 'Basic first aid and CPR' },
	{ name: 'EMT', category: 'Medical', description: 'Emergency Medical Technician certification' },
	{ name: 'Paramedic', category: 'Medical', description: 'Advanced emergency medical care' },
	{ name: 'Nursing', category: 'Medical', description: 'Licensed nurse (RN/LPN)' },
	{ name: 'Physician', category: 'Medical', description: 'Medical doctor (MD/DO)' },
	{ name: 'Veterinary', category: 'Medical', description: 'Animal medical care' },
	{ name: 'Mental Health Counseling', category: 'Medical', description: 'Crisis and trauma counseling' },
	
	// Construction & Repair
	{ name: 'Carpentry', category: 'Construction', description: 'Wood construction and repair' },
	{ name: 'Plumbing', category: 'Construction', description: 'Water and drain systems' },
	{ name: 'Electrical', category: 'Construction', description: 'Electrical systems and wiring' },
	{ name: 'HVAC', category: 'Construction', description: 'Heating, ventilation, air conditioning' },
	{ name: 'Welding', category: 'Construction', description: 'Metal joining and fabrication' },
	{ name: 'Roofing', category: 'Construction', description: 'Roof installation and repair' },
	{ name: 'Masonry', category: 'Construction', description: 'Brick, stone, and concrete work' },
	
	// Communication
	{ name: 'Ham Radio Operator', category: 'Communication', description: 'Amateur radio communication' },
	{ name: 'Translation', category: 'Communication', description: 'Language translation services' },
	{ name: 'Sign Language', category: 'Communication', description: 'ASL or other sign language' },
	{ name: 'Public Speaking', category: 'Communication', description: 'Crisis communication and announcements' },
	
	// Transportation
	{ name: 'Commercial Driving', category: 'Transportation', description: 'CDL truck/bus driving' },
	{ name: 'Pilot', category: 'Transportation', description: 'Aircraft operation' },
	{ name: 'Boat Operation', category: 'Transportation', description: 'Watercraft operation' },
	{ name: 'Heavy Equipment Operation', category: 'Transportation', description: 'Bulldozer, excavator, crane' },
	
	// Logistics
	{ name: 'Warehouse Management', category: 'Logistics', description: 'Supply organization and distribution' },
	{ name: 'Supply Chain', category: 'Logistics', description: 'Resource coordination and logistics' },
	{ name: 'Inventory Management', category: 'Logistics', description: 'Tracking and managing supplies' },
	
	// Food & Nutrition
	{ name: 'Cooking at Scale', category: 'Food', description: 'Large-scale meal preparation' },
	{ name: 'Food Safety', category: 'Food', description: 'Safe food handling and storage' },
	{ name: 'Food Preservation', category: 'Food', description: 'Canning, drying, freezing' },
	{ name: 'Nutrition Planning', category: 'Food', description: 'Dietary planning and meal design' },
	
	// Shelter & Housing
	{ name: 'Temporary Shelter Setup', category: 'Shelter', description: 'Emergency housing setup' },
	{ name: 'Camp Management', category: 'Shelter', description: 'Organizing temporary camps' },
	
	// Search & Rescue
	{ name: 'Wilderness Search & Rescue', category: 'Search & Rescue', description: 'Backcountry rescue operations' },
	{ name: 'Urban Search & Rescue', category: 'Search & Rescue', description: 'Structural collapse rescue' },
	{ name: 'Water Rescue', category: 'Search & Rescue', description: 'Swift water and flood rescue' },
	
	// Specialized
	{ name: 'Hazmat Response', category: 'Hazmat', description: 'Chemical spill and hazard response' },
	{ name: 'Fire Fighting', category: 'Fire', description: 'Structural and wildland firefighting' },
	{ name: 'Chainsaw Operation', category: 'Tools', description: 'Safe chainsaw use for clearing' },
	{ name: 'Tree Removal', category: 'Tools', description: 'Safe tree felling and removal' },
	
	// Administrative
	{ name: 'Emergency Coordination', category: 'Administration', description: 'Incident command and coordination' },
	{ name: 'Documentation', category: 'Administration', description: 'Record keeping and reporting' },
	{ name: 'Volunteer Management', category: 'Administration', description: 'Organizing and directing volunteers' },
];

console.log(`Creating ${skills.length} emergency skills...`);
for (const skill of skills) {
	try {
		createEmergencySkill(skill);
		console.log(`  ✓ ${skill.name}`);
	} catch (err) {
		console.error(`  ✗ ${skill.name}:`, err);
	}
}

// Emergency Tools & Equipment
const tools = [
	// Vehicles
	{ name: 'Pickup Truck', category: 'Vehicle', description: 'Light-duty truck for transport' },
	{ name: 'Large Truck', category: 'Vehicle', description: 'Heavy-duty truck (1-ton or larger)' },
	{ name: 'Trailer', category: 'Vehicle', description: 'Cargo or equipment trailer' },
	{ name: 'ATV/UTV', category: 'Vehicle', description: 'All-terrain vehicle' },
	{ name: 'Boat', category: 'Vehicle', description: 'Watercraft for rescue or transport' },
	{ name: 'Aircraft', category: 'Vehicle', description: 'Private plane or helicopter' },
	{ name: 'Bus', category: 'Vehicle', description: 'Passenger transport' },
	
	// Power Equipment
	{ name: 'Portable Generator', category: 'Power', description: 'Gasoline/propane generator' },
	{ name: 'Large Generator', category: 'Power', description: '10kW+ generator system' },
	{ name: 'Solar Power System', category: 'Power', description: 'Portable solar panels' },
	{ name: 'Battery Bank', category: 'Power', description: 'Large battery storage system' },
	{ name: 'Extension Cords & Power Strips', category: 'Power', description: 'Heavy-duty power distribution' },
	
	// Medical
	{ name: 'First Aid Kit', category: 'Medical', description: 'Basic first aid supplies' },
	{ name: 'Advanced Medical Kit', category: 'Medical', description: 'EMT/paramedic supplies' },
	{ name: 'AED', category: 'Medical', description: 'Automated External Defibrillator' },
	{ name: 'Medical Equipment', category: 'Medical', description: 'Diagnostic or treatment equipment' },
	
	// Communication
	{ name: 'Ham Radio', category: 'Communication', description: 'Amateur radio transceiver' },
	{ name: 'Satellite Phone', category: 'Communication', description: 'Emergency satellite communication' },
	{ name: 'Two-Way Radios', category: 'Communication', description: 'Walkie-talkies/FRS/GMRS' },
	{ name: 'Megaphone/PA System', category: 'Communication', description: 'Public address equipment' },
	
	// Construction Tools
	{ name: 'Chainsaw', category: 'Tools', description: 'Gas or electric chainsaw' },
	{ name: 'Power Tools', category: 'Tools', description: 'Drill, saw, impact driver, etc.' },
	{ name: 'Hand Tools', category: 'Tools', description: 'Hammers, wrenches, screwdrivers' },
	{ name: 'Ladder', category: 'Tools', description: 'Extension or step ladder' },
	{ name: 'Scaffolding', category: 'Tools', description: 'Temporary work platforms' },
	
	// Shelter
	{ name: 'Tents', category: 'Shelter', description: 'Camping or event tents' },
	{ name: 'Cots', category: 'Shelter', description: 'Portable sleeping cots' },
	{ name: 'Blankets', category: 'Shelter', description: 'Emergency blankets' },
	{ name: 'Tarps', category: 'Shelter', description: 'Large waterproof tarps' },
	{ name: 'Portable Toilets', category: 'Shelter', description: 'Emergency sanitation' },
	
	// Food Preparation
	{ name: 'Commercial Kitchen Access', category: 'Food', description: 'Large-scale cooking facility' },
	{ name: 'Large Coolers', category: 'Food', description: 'Food storage and transport' },
	{ name: 'Camp Stoves', category: 'Food', description: 'Portable cooking equipment' },
	{ name: 'Propane Tanks', category: 'Food', description: 'Fuel for cooking' },
	
	// Water
	{ name: 'Water Filtration System', category: 'Water', description: 'Emergency water purification' },
	{ name: 'Water Storage Containers', category: 'Water', description: 'Large water tanks or barrels' },
	{ name: 'Water Distribution Equipment', category: 'Water', description: 'Pumps, hoses, dispensers' },
	
	// Fuel Storage
	{ name: 'Gasoline Storage', category: 'Fuel', description: 'Safe fuel storage (>50 gallons)' },
	{ name: 'Diesel Storage', category: 'Fuel', description: 'Diesel fuel storage' },
	{ name: 'Propane Storage', category: 'Fuel', description: 'Propane tank(s)' },
	
	// Heavy Equipment
	{ name: 'Excavator', category: 'Heavy Equipment', description: 'Tracked excavator' },
	{ name: 'Bulldozer', category: 'Heavy Equipment', description: 'Track-type tractor' },
	{ name: 'Forklift', category: 'Heavy Equipment', description: 'Material handling equipment' },
	{ name: 'Crane', category: 'Heavy Equipment', description: 'Mobile or fixed crane' },
	{ name: 'Dump Truck', category: 'Heavy Equipment', description: 'Large dump truck' },
];

console.log(`\nCreating ${tools.length} emergency tools...`);
for (const tool of tools) {
	try {
		createEmergencyTool(tool);
		console.log(`  ✓ ${tool.name}`);
	} catch (err) {
		console.error(`  ✗ ${tool.name}:`, err);
	}
}

console.log('\n✓ Emergency registry seeded successfully!');
