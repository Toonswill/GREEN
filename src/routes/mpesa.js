const express = require('express');
const router = express.Router();
const { updateInvestment, getInvestments, getProjectById, updateProject } = require('../services/database');

// M-Pesa Callback URL - M-Pesa will send payment confirmation here
router.post('/callback', async (req, res) => {
    console.log('📞 M-Pesa Callback received');
    
    try {
        const { Body } = req.body;
        
        if (!Body || !Body.stkCallback) {
            console.log('Invalid callback payload');
            return res.status(200).json({ ResultCode: 0, ResultDesc: 'Success' });
        }

        const {
            MerchantRequestID,
            CheckoutRequestID,
            ResultCode,
            ResultDesc,
            CallbackMetadata
        } = Body.stkCallback;

        console.log(`Callback: ${CheckoutRequestID} - ${ResultCode} - ${ResultDesc}`);

        if (ResultCode === 0) {
            // Payment successful
            const metadata = {};
            if (CallbackMetadata && CallbackMetadata.Item) {
                CallbackMetadata.Item.forEach(item => {
                    metadata[item.Name] = item.Value;
                });
            }

            const amount = metadata.Amount;
            const mpesaReceiptNumber = metadata.MpesaReceiptNumber;
            const phoneNumber = metadata.PhoneNumber;

            console.log(`✅ Payment confirmed: ${mpesaReceiptNumber} for KES ${amount}`);

            // Find pending investment with this checkout ID
            const investments = getInvestments();
            const pendingInvestment = investments.find(
                inv => inv.checkoutRequestId === CheckoutRequestID && inv.status === 'pending'
            );

            if (pendingInvestment) {
                // Update investment
                updateInvestment(pendingInvestment.id, {
                    status: 'completed',
                    mpesaReceiptNumber: mpesaReceiptNumber,
                    completedAt: new Date()
                });

                // Update project funding
                const project = getProjectById(pendingInvestment.projectId);
                if (project) {
                    const newAmount = (project.currentAmount || 0) + pendingInvestment.amount;
                    const newInvestorCount = (project.investorCount || 0) + 1;
                    const newStatus = newAmount >= project.goalAmount ? 'funded' : project.status;
                    
                    updateProject(project.id, {
                        currentAmount: newAmount,
                        investorCount: newInvestorCount,
                        status: newStatus
                    });
                }

                console.log(`💚 Investment ${pendingInvestment.id} confirmed for project ${pendingInvestment.projectTitle}`);
            } else {
                console.log(`⚠️ No pending investment found for CheckoutRequestID: ${CheckoutRequestID}`);
            }
        } else {
            // Payment failed
            console.log(`❌ Payment failed: ${ResultDesc}`);
            
            // Update investment as failed
            const investments = getInvestments();
            const failedInvestment = investments.find(
                inv => inv.checkoutRequestId === CheckoutRequestID && inv.status === 'pending'
            );
            
            if (failedInvestment) {
                updateInvestment(failedInvestment.id, {
                    status: 'failed',
                    failureReason: ResultDesc,
                    completedAt: new Date()
                });
            }
        }

        // Always return success to M-Pesa
        res.status(200).json({ ResultCode: 0, ResultDesc: 'Success' });
    } catch (error) {
        console.error('Callback error:', error);
        res.status(200).json({ ResultCode: 0, ResultDesc: 'Success' });
    }
});

// Manual query endpoint (for checking payment status)
router.get('/status/:checkoutRequestId', async (req, res) => {
    const { checkoutRequestId } = req.params;
    const { queryStatus } = require('../services/mpesa');
    
    try {
        const status = await queryStatus(checkoutRequestId);
        res.json({ success: true, status });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;