const Portfolio = require('../models/Portfolio');
const Stock = require('../models/Stock');
const MutualFund = require('../models/MutualFund');
const Property = require('../models/Property');
const { getAngelOneHoldings } = require('../utils/angelOne');
const { generateAIReport } = require('../utils/aiReport');

exports.syncPortfolio = async (req, res) => {
    try {
        const { apiKey } = req.body || {};
        const holdingsData = await getAngelOneHoldings(apiKey);
        let portfolio = await Portfolio.findOne({ userId: req.user.id });
        if (portfolio) {
            portfolio.stocks = holdingsData;
            portfolio.lastSynced = new Date();
        } else {
            portfolio = new Portfolio({
                userId: req.user.id,
                stocks: holdingsData,
                lastSynced: new Date()
            });
        }
        await portfolio.save();
        res.json({ message: 'Portfolio synced successfully', portfolio });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getPortfolio = async (req, res) => {
    try {
        const synced = await Portfolio.findOne({ userId: req.user.id });
        const manualStocks = await Stock.find({ userId: req.user.id });
        const mutualFunds = await MutualFund.find({ userId: req.user.id });
        const properties = await Property.find({ userId: req.user.id });

        res.json({
            syncedStocks: synced ? synced.stocks : [],
            manualStocks,
            mutualFunds,
            properties
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.addManualStock = async (req, res) => {
    try {
        const { name, symbol, invested, currentValue, quantity, sector } = req.body;
        const newStock = new Stock({
            userId: req.user.id,
            name,
            symbol: symbol || name,
            purchasePrice: invested,
            currentPrice: currentValue,
            quantity: quantity || 1,
            sector: sector || 'Other'
        });
        await newStock.save();
        res.status(201).json(newStock);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.addMutualFund = async (req, res) => {
    try {
        const { name, invested, currentValue, type } = req.body;
        const newFund = new MutualFund({
            userId: req.user.id,
            name,
            investedAmount: invested,
            currentValue,
            type: type || 'Equity'
        });
        await newFund.save();
        res.status(201).json(newFund);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.addProperty = async (req, res) => {
    try {
        const { name, invested, currentValue, type, location } = req.body;
        const newProperty = new Property({
            userId: req.user.id,
            name,
            purchasePrice: invested,
            estimatedValue: currentValue,
            propertyType: type || 'Residential',
            location: location || ''
        });
        await newProperty.save();
        res.status(201).json(newProperty);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getAIReport = async (req, res) => {
    try {
        const synced = await Portfolio.findOne({ userId: req.user.id });
        const manualStocks = await Stock.find({ userId: req.user.id });
        const mutualFunds = await MutualFund.find({ userId: req.user.id });
        const properties = await Property.find({ userId: req.user.id });

        const allHoldings = {
            syncedStocks: synced ? synced.stocks : [],
            manualStocks: manualStocks.map(s => ({ tradingsymbol: s.name, quantity: s.quantity, averageprice: s.purchasePrice, ltp: s.currentPrice })),
            mutualFunds,
            properties
        };
        
        const report = await generateAIReport(allHoldings);
        res.json({ report });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateManualStock = async (req, res) => {
    try {
        const { name, symbol, invested, currentValue, quantity, sector } = req.body;
        let stock = await Stock.findOne({ _id: req.params.id, userId: req.user.id });
        if (!stock) {
            return res.status(404).json({ message: 'Stock not found' });
        }
        stock.name = name || stock.name;
        stock.symbol = symbol || stock.symbol;
        stock.purchasePrice = invested !== undefined ? invested : stock.purchasePrice;
        stock.currentPrice = currentValue !== undefined ? currentValue : stock.currentPrice;
        stock.quantity = quantity !== undefined ? quantity : stock.quantity;
        stock.sector = sector || stock.sector;
        
        await stock.save();
        res.json(stock);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteManualStock = async (req, res) => {
    try {
        const stock = await Stock.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
        if (!stock) {
            return res.status(404).json({ message: 'Stock not found' });
        }
        res.json({ message: 'Stock deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateMutualFund = async (req, res) => {
    try {
        const { name, invested, currentValue, type } = req.body;
        let fund = await MutualFund.findOne({ _id: req.params.id, userId: req.user.id });
        if (!fund) {
            return res.status(404).json({ message: 'Mutual Fund not found' });
        }
        fund.name = name || fund.name;
        fund.investedAmount = invested !== undefined ? invested : fund.investedAmount;
        fund.currentValue = currentValue !== undefined ? currentValue : fund.currentValue;
        fund.type = type || fund.type;
        
        await fund.save();
        res.json(fund);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteMutualFund = async (req, res) => {
    try {
        const fund = await MutualFund.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
        if (!fund) {
            return res.status(404).json({ message: 'Mutual Fund not found' });
        }
        res.json({ message: 'Mutual Fund deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateProperty = async (req, res) => {
    try {
        const { name, invested, currentValue, type, location } = req.body;
        let property = await Property.findOne({ _id: req.params.id, userId: req.user.id });
        if (!property) {
            return res.status(404).json({ message: 'Property not found' });
        }
        property.name = name || property.name;
        property.purchasePrice = invested !== undefined ? invested : property.purchasePrice;
        property.estimatedValue = currentValue !== undefined ? currentValue : property.estimatedValue;
        property.propertyType = type || property.propertyType;
        property.location = location !== undefined ? location : property.location;
        
        await property.save();
        res.json(property);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteProperty = async (req, res) => {
    try {
        const property = await Property.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
        if (!property) {
            return res.status(404).json({ message: 'Property not found' });
        }
        res.json({ message: 'Property deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
