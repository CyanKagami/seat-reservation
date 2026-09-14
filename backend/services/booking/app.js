import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

const router = express.Router();

router.get('/seats', (req, res) => {
  // Query seat availability from DynamoDB
  res.json({ seats: ['A1', 'A2', 'A3'] });
});

router.post('/reserve', (req, res) => {
  // Seat reservation logic
  res.json({ status: "reserved" });
});

app.use('/booking', router);

export default app;