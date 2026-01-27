import express from 'express';

const walletRouter = express.Router();


walletRouter.get("/", (req, res) => {
  res.json({ balance: 10000 });
});

walletRouter.post("/add", (req, res) => {
  res.json({ message: "Money added" });
});


export default walletRouter;