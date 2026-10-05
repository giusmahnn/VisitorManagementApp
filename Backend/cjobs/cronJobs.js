const cron = require('node-cron');
const Visitors = require('../models/Visitors'); // Make sure this path correctly points to your Visitor model

// This schedule expression ("0 0 * * *") triggers precisely at 12:00 AM (midnight) every single night
const startAutoCheckoutJob = () => {
    // 0 0 0 0 0 -represents Minutes, Hours, Day, Month, Weekly
    cron.schedule('0 0 * * *', async () => {
        console.log('⏰ Running automated midnight visitor clean-up task...');

        try {
            // 1. Find all visitors who are still logged as inside the building
            const lingeringVisitors = await Visitors.find({ status: 'Checked In' });

            if (lingeringVisitors.length === 0) {
                console.log('✅ Clean-up finished: No lingering visitors found inside the building.');
                return;
            }

            console.log(`⚠️ Found ${lingeringVisitors.length} visitors who forgot to check out. Force checking out now...`);

            // 2. Setup our automated system checkout values
            const systemCheckoutTime = new Date();

            // 3. Loop through and update each record
            for (const visitor of lingeringVisitors) {
                visitor.status = 'Checked Out';
                visitor.checkOutTime = systemCheckoutTime;
                
                // Optional: You can append a note so admins know the system did this, not a scanner
                visitor.purpose = visitor.purpose 
                    ? `${visitor.purpose} (Auto-System Checkout at Midnight)`
                    : '(Auto-System Checkout at Midnight)';

                await visitor.save();
                console.log(`[Auto-Checked Out] ID: ${visitor.visitorId} | Name: ${visitor.visitorName}`);
            }

            console.log(`🎉 Success: Automatically checked out ${lingeringVisitors.length} visitors cleanly.`);

        } catch (error) {
            console.error('❌ Error executing automated midnight checkout job:', error.message);
        }
    });
};

module.exports = startAutoCheckoutJob;
