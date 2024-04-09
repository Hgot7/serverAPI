const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { ObjectId } = require('mongoose').Types;
const app = express();
const bodyParser = require('body-parser');
app.use(cors());
app.use(express.json()); // ใช้ express.json() แทน body-parser
var jsonParser = bodyParser.json();
const PORT = process.env.PORT || 80;
require('dotenv').config(); // Load environment variables

// mongoose.connect("mongodb://127.0.0.1:27017/Record")
(async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to DB");
        app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
    } catch (err) {
        console.error(err);
    }
})();


//endpoint show ข้อมูลตาม ID
app.get('/api/Payment', async (req, res) => {
    try {
        const payments = await mongoose.connection.collection('Payment').find().toArray();
        //console.log(payments);
        //res.status(200).json(payments);
        res.send(payments);
    } catch (error) {
        console.error('Error fetching documents:', error);
        res.status(500).json({ error: 'Could not fetch the documents' });
    }
});




//endpoint Update ข้อมูลตาม ID
app.put('/api/Payment/:id', async (req, res) => {
    const Net = 631;
    try {
        const payment = req.body.payment;
        const total = parseFloat(payment) + Net;
        const paymentId = req.params.id;

        // ตรวจสอบว่า req.body ถูกกำหนดค่าหรือไม่
        if (!req.body) {
            return res.status(400).json({ error: 'Invalid request body' });
        }

        // จะใช้ $set ในการอัปเดตหลายๆ ฟิลด์ใน collection
        const updatedData = await mongoose.connection.collection('Payment')
            .findOneAndUpdate(
                { _id: new mongoose.Types.ObjectId(paymentId) },
                { $set: { Total: total, payment: payment }, $currentDate: { timestamp: true } },
            );

        res.json({ success: true, message: 'Data update successfully', updatedData: updatedData });

    } catch (error) {
        console.error('Error updating data:', error);
        res.status(500).json({ error: 'Could not update the data.' });
    }
});

//endpoint search ข้อมูลตาม ID
app.get('/api/Payment/:id', async (req, res) => {
    const paymentId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(paymentId)) {
        return res.status(400).json({ error: 'Invalid payment ID' });
    }

    try {
        const payment = await mongoose.connection.collection('Payment')
            .find({ _id: new mongoose.Types.ObjectId(paymentId) })
            .toArray();

        if (!payment || payment.length === 0) {
            return res.status(404).json({ error: 'Payment not found' });
        }

        res.status(200).json(payment[0]);
    } catch (error) {
        console.error('Error fetching payment:', error);
        res.status(500).json({ error: 'Could not fetch the document' });
    }
});


/////////////////////////////////////////////////////// Endpoint สำหรับเพิ่มข้อมูล
const paymentSchema = new mongoose.Schema({
    payment: {
        type: String,
        required: true,
    },
    Total: {
        type: Number,
        default: 0,
    },
    timestamp: {
        type: Date,
        default: Date.now,
    },
}, { collection: 'Payment', versionKey: false });  // Specify the collection name explicitly // Disable the version key 

const Payment = mongoose.model('Payment', paymentSchema);


// Endpoint สำหรับเพิ่มข้อมูล
app.post('/api/Payment', async (req, res) => {
    const Net = 631;
    try {
        const { payment, timestamp } = req.body;
        const total = parseFloat(payment) + Net;

        // Check the validity of the received data
        if (!payment || !timestamp) {
            return res.status(400).json({ error: 'Invalid request body' });
        }

        const newPayment = new Payment({
            payment: payment,
            Total: total,
            timestamp: timestamp,
        });

        await newPayment.save();

        res.status(201).json(newPayment);
    } catch (error) {
        console.error('Error creating data:', error);
        res.status(500).json({ error: 'Could not create the data.' });
    }
});



/////////////////////////////////////////////////////// Endpoint Delete สำหรับลบข้อมูล

app.delete('/api/Payment/:id', async (req, res) => {
    const paymentId = req.params.id;

    try {
        // Check if the payment with the given ID exists
        const existingPayment = await mongoose.connection.collection('Payment')
            .findOne({ _id: new mongoose.Types.ObjectId(paymentId) });
        if (!existingPayment) {
            return res.status(404).json({ error: 'Payment not found' });
        }
        // Delete the payment
        await mongoose.connection.collection('Payment')
            .deleteOne({ _id: new mongoose.Types.ObjectId(paymentId) });

        res.json({ success: true, message: 'Payment deleted successfully' });
    } catch (error) {
        console.error('Error deleting payment:', error);
        res.status(500).json({ error: 'Could not delete the payment.' });
    }
});






