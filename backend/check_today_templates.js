const mongoose = require('mongoose');
require('dotenv').config();

async function check() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const Template = mongoose.model('Template', new mongoose.Schema({ name: String, updated_at: Date }));
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        const t = await Template.find({ updated_at: { $gte: startOfToday } });
        console.log('Templates updated today:', t.length);
        t.forEach(x => console.log(' - ' + x.name));

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}
check();
