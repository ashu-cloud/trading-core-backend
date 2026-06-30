
export default async function simulatePaymentGateway(amount){
    
    // Simulate a delay for payment processing

    const delay  = Math.floor(Math.random()*2000) + 1000;

    await new Promise(resolve => setTimeout(resolve, delay));

    // Simulate a random success or failure outcome
    const isSuccess = Math.random() < 0.8; // 80% chance of success
    if(isSuccess) {
        return {
            success: true,
            gatewayRef: 'GATEWAY_REF_' + Math.random().toString(36).substr(2, 9).toUpperCase()
        }
    } else {
        return {
            success: false,
            error: 'GATEWAY_DECLINED.'
        }
    }
}