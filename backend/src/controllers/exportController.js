const Vehicle = require('../models/Vehicle');
const Trip = require('../models/Trip');
const PDFDocument = require('pdfkit');

exports.exportVehiclesCsv = async (req, res, next) => {
  try {
    const vehicles = await Vehicle.find({ communityId: req.user.communityId }).lean();
    const headers = 'Name,License Plate,Capacity,Odometer,Status,Risk Score,Total Revenue,Total Maintenance,Total Fuel,ROI\n';
    const rows = vehicles.map(
      v =>
        `${v.name},${v.licensePlate},${v.capacity},${v.odometer},${v.status},${v.riskScore || 0},${v.totalRevenue || 0},${v.totalMaintenanceCost || 0},${v.totalFuelCost || 0},${v.acquisitionCost ? ((v.totalRevenue - (v.totalMaintenanceCost + v.totalFuelCost)) / v.acquisitionCost * 100).toFixed(2) : 0}`
    );
    const csv = headers + rows.join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=vehicles.csv');
    res.send(csv);
  } catch (err) {
    next(err);
  }
};

exports.exportTripsCsv = async (req, res, next) => {
  try {
    const trips = await Trip.find({ communityId: req.user.communityId }).populate('vehicleId', 'name licensePlate').populate('driverId', 'name').lean();
    const headers = 'Vehicle,Driver,Cargo Weight,Distance,Revenue,Status,Start,End\n';
    const rows = trips.map(
      t =>
        `${(t.vehicleId && t.vehicleId.name) || ''},${(t.driverId && t.driverId.name) || ''},${t.cargoWeight},${t.distance},${t.revenue || 0},${t.status},${t.startTime || ''},${t.endTime || ''}`
    );
    const csv = headers + rows.join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=trips.csv');
    res.send(csv);
  } catch (err) {
    next(err);
  }
};

exports.exportReportPdf = async (req, res, next) => {
  try {
    const [vehicles, trips] = await Promise.all([
      Vehicle.find({ communityId: req.user.communityId }).lean(),
      Trip.find({ communityId: req.user.communityId, status: 'Completed' }).lean(),
    ]);
    const totalRevenue = trips.reduce((s, t) => s + (t.revenue || 0), 0);
    const doc = new PDFDocument({ margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=fleet-report.pdf');
    doc.pipe(res);
    doc.fontSize(20).text('FleetFlow AI - Fleet Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Generated: ${new Date().toISOString().split('T')[0]}`);
    doc.text(`Total Vehicles: ${vehicles.length}`);
    doc.text(`Completed Trips: ${trips.length}`);
    doc.text(`Total Revenue: $${totalRevenue.toFixed(2)}`);
    doc.moveDown();
    doc.text('Vehicle Summary:');
    vehicles.slice(0, 10).forEach((v, i) => {
      doc.text(`${i + 1}. ${v.name} (${v.licensePlate}) - ${v.status} - Risk: ${v.riskScore || 0}`);
    });
    doc.end();
  } catch (err) {
    next(err);
  }
};
