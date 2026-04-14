import Child from '../models/Child.js';
import User from '../models/User.js';

export const assignAllChildrenToSampleDoctor = async () => {
  const sampleDoctorEmail = (process.env.SAMPLE_DOCTOR_EMAIL || 'doctor@aiims.com').toLowerCase();

  const sampleDoctor = await User.findOne({
    email: sampleDoctorEmail,
    role: 'doctor',
  }).select('_id email name doctorId');

  if (!sampleDoctor) {
    console.warn(`[ASSIGNMENT] Sample doctor not found for email: ${sampleDoctorEmail}`);
    return;
  }

  const updateResult = await Child.updateMany(
    { doctorId: { $ne: sampleDoctor._id } },
    { $set: { doctorId: sampleDoctor._id } }
  );

  console.log(
    `[ASSIGNMENT] Assigned children to sample doctor ${sampleDoctor.name || sampleDoctor.email} (${sampleDoctor.doctorId || sampleDoctor._id}). Matched: ${updateResult.matchedCount}, Modified: ${updateResult.modifiedCount}`
  );
};

