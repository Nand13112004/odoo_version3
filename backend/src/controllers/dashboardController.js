const Vehicle = require('../models/Vehicle');
const Trip = require('../models/Trip');
const Driver = require('../models/Driver');
const Maintenance = require('../models/Maintenance');
const { ROLES } = require('../config/roles');

/**
 * Command Center stats - role-based scope:
 * Manager: full KPIs + filter capability
 * Dispatcher: limited (active fleet, pending cargo, available vehicles/drivers)
 * SafetyOfficer: compliance only (suspended drivers, compliance alerts)
 * FinancialAnalyst: financial KPIs only (operational cost, revenue vs expense)
 */
exports.getStats = async (req, res, next) => {
  try {
    const role = req.user?.role;
    const [vehicles, trips, drivers, maintenances] = await Promise.all([
      Vehicle.find(),
      Trip.find({ status: { $in: ['Dispatched', 'Draft'] } }),
      Driver.find(),
      Maintenance.find({ date: { $gte: new Date(new Date().setDate(1)) } }),
    ]);

    const activeFleet = vehicles.filter(v => v.status === 'Available' || v.status === 'On Trip').length;
    const inMaintenance = vehicles.filter(v => v.status === 'In Shop').length;
    const totalFleet = vehicles.length;
    const utilization = totalFleet > 0 ? Math.round((vehicles.filter(v => v.status === 'On Trip').length / totalFleet) * 100) : 0;
    const pendingCargo = trips.reduce((s, t) => s + (t.cargoWeight || 0), 0);
    const highRiskVehicles = vehicles.filter(v => (v.riskScore || 0) >= 70).length;
    const availableVehicles = vehicles.filter(v => v.status === 'Available');
    const availableDrivers = drivers.filter(d => d.status === 'On Duty' || d.status === 'Off Duty');
    const suspendedDrivers = drivers.filter(d => d.status === 'Suspended');
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const completedTrips = await Trip.find({ status: 'Completed', endTime: { $gte: startOfMonth } });
    const monthlyRevenue = completedTrips.reduce((s, t) => s + (t.revenue || 0), 0);
    const monthlyCost = completedTrips.reduce((s, t) => s + (t.cost || 0), 0);
    const monthlyMaintenance = await Maintenance.aggregate([
      { $match: { date: { $gte: startOfMonth } } },
      { $group: { _id: null, total: { $sum: '$cost' } } },
    ]);
    const monthlyMaintenanceTotal = monthlyMaintenance[0]?.total || 0;
    const monthlyProfit = monthlyRevenue - monthlyCost - monthlyMaintenanceTotal;
    const totalOperationalCost = monthlyCost + monthlyMaintenanceTotal;

    let data = {};
    if (role === ROLES.Manager) {
      data = {
        scope: 'full',
        activeFleetCount: activeFleet,
        vehiclesInMaintenance: inMaintenance,
        utilizationPercent: utilization,
        pendingCargo,
        highRiskVehicles,
        monthlyProfit,
        monthlyRevenue,
        totalFleet,
        totalOperationalCost,
        availableVehiclesCount: availableVehicles.length,
        suspendedDriversCount: suspendedDrivers.length,
      };
    } else if (role === ROLES.Dispatcher) {
      data = {
        scope: 'limited',
        activeFleetCount: activeFleet,
        pendingCargo,
        availableVehiclesCount: availableVehicles.length,
        availableDriversCount: availableDrivers.length,
        totalFleet,
      };
    } else if (role === ROLES.SafetyOfficer) {
      data = {
        scope: 'compliance',
        suspendedDriversCount: suspendedDrivers.length,
        suspendedDrivers: suspendedDrivers.map(d => ({ _id: d._id, name: d.name, status: d.status, licenseExpiry: d.licenseExpiry })),
        complianceAlerts: highRiskVehicles > 0 ? [`${highRiskVehicles} high-risk vehicle(s)`] : [],
      };
    } else if (role === ROLES.FinancialAnalyst) {
      data = {
        scope: 'financial',
        totalOperationalCost,
        monthlyRevenue,
        monthlyProfit,
        revenueVsExpense: { revenue: monthlyRevenue, expense: totalOperationalCost },
      };
    } else {
      data = { scope: 'full', activeFleetCount: activeFleet, totalFleet };
    }

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

exports.getCharts = async (req, res, next) => {
  try {
    const vehicles = await Vehicle.find();
    const revenueVsExpense = vehicles.map(v => ({
      name: v.name,
      revenue: v.totalRevenue || 0,
      expense: (v.totalMaintenanceCost || 0) + (v.totalFuelCost || 0),
    }));

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const fuelLogs = await require('../models/FuelLog').aggregate([
      { $match: { date: { $gte: sixMonthsAgo } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$date' } }, cost: { $sum: '$cost' } } },
      { $sort: { _id: 1 } },
    ]);
    const fuelTrend = fuelLogs.map(f => ({ month: f._id, cost: f.cost }));

    const statusCounts = { Available: 0, 'On Trip': 0, 'In Shop': 0, Retired: 0 };
    vehicles.forEach(v => { if (statusCounts[v.status] !== undefined) statusCounts[v.status]++; });
    const fleetUtilization = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

    const roiComparison = vehicles.map(v => ({
      name: v.name,
      roi: v.acquisitionCost ? ((v.totalRevenue - (v.totalMaintenanceCost + v.totalFuelCost)) / v.acquisitionCost) * 100 : 0,
    }));

    res.json({
      success: true,
      data: { revenueVsExpense, fuelTrend, fleetUtilization, roiComparison },
    });
  } catch (err) {
    next(err);
  }
};
