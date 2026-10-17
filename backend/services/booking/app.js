import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());


app.get('/seats', (req, res) => {
  // Query seat availability from DynamoDB
  res.json({ seats: ['A1', 'A2', 'A3'] });
});

app.post('/reserve', (req, res) => {
  // Seat reservation logic
  res.json({ status: "reserved" });
});

export default app;