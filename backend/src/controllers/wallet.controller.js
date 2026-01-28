import User from '../models/user.model.js';



export const getUserBalance = async (req, res)=>{
    try{

        const user = await User.findById(req.user._id).select("wallet_balance");
        if(!user){
            return res.status(404).json({
                success:false,
                message: "User not Found"
            })
        }

        res.status(200).json({
            success:true,
            wallet_balance : user.wallet_balance
        });

    }catch(err){
        return res.status(500).json({
            success:false,
            message: `Error occured in getUserBalance controller and the error is ${err.message}`
        })
    }
}



export const depositMoney = async (req, res) => {
  try {
    const amount = Number(req.body.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid deposit amount"
      });
    }

    if (amount > 1_000_000) {
      return res.status(400).json({
        success: false,
        message: "Deposit amount exceeds limit"
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $inc: { wallet_balance: amount } },
      { new: true }
    ).select("wallet_balance");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Money deposited successfully",
      wallet_balance: user.wallet_balance
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: `Deposit failed: ${err.message}`
    });
  }
};
