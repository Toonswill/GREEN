const bcrypt = require('bcryptjs');
const { getUsers, addUser, updateUser, getUserByEmail, getUserById } = require('../services/database');

const User = {
    create: async (userData) => {
        const existingUser = getUserByEmail(userData.email);
        if (existingUser) {
            throw new Error('User already exists');
        }
        
        const user = {
            firstName: userData.firstName,
            lastName: userData.lastName,
            email: userData.email,
            phoneNumber: userData.phoneNumber,
            password: userData.password,
            kycStatus: userData.kycStatus || 'pending',
            kycDocumentUrl: userData.kycDocumentUrl || null,
            role: userData.role || 'investor',
            walletBalance: 0,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        
        return addUser(user);
    },

    findByEmail: async (email) => {
        return getUserByEmail(email);
    },

    findById: async (id) => {
        return getUserById(parseInt(id));
    },

    findAll: async () => {
        return getUsers();
    },

    updateKYC: async (userId, documentUrl) => {
        return updateUser(parseInt(userId), {
            kycDocumentUrl: documentUrl,
            kycStatus: 'pending',
            updatedAt: new Date()
        });
    },

    approveKYC: async (userId) => {
        return updateUser(parseInt(userId), {
            kycStatus: 'verified',
            updatedAt: new Date()
        });
    },

    rejectKYC: async (userId) => {
        return updateUser(parseInt(userId), {
            kycStatus: 'rejected',
            updatedAt: new Date()
        });
    },

    updateWallet: async (userId, amount, operation = 'add') => {
        const user = await User.findById(userId);
        if (!user) throw new Error('User not found');
        
        let newBalance = user.walletBalance;
        if (operation === 'add') {
            newBalance += amount;
        } else if (operation === 'subtract') {
            if (user.walletBalance < amount) {
                throw new Error('Insufficient wallet balance');
            }
            newBalance -= amount;
        }
        
        return updateUser(parseInt(userId), {
            walletBalance: newBalance,
            updatedAt: new Date()
        });
    }
};

module.exports = { User };