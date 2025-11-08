import mongoose from "mongoose";
import { Referral, ReferralStatus } from "../app/models/Referral.model";
import { User } from "../app/models/User.model";
import { Booking } from "../app/modules/booking/booking.model";
import { NotificationType } from "../app/models";
import { notificationService } from "../app/modules/notification/notification.service";

/**
 * Process referral rewards when a booking is completed
 * - First booking: Award 10 credits to referrer
 * - Third booking: Award additional 5 credits bonus to referrer
 */
export const processReferralRewards = async (
  customerId: string,
  session?: mongoose.ClientSession
) => {
  try {
    // Find the referral record where this user is the referee
    const referralRecord = await Referral.findOne({
      refereeId: customerId,
      status: ReferralStatus.PENDING,
    }).session(session || null);

    // If no referral record exists, this user wasn't referred by anyone
    if (!referralRecord) {
      return;
    }

    // Count completed bookings for this customer
    const completedBookingsCount = await Booking.countDocuments({
      customerId: customerId,
      status: "COMPLETED",
    }).session(session || null);

    // Update the completed bookings count in referral record
    referralRecord.completedBookingsCount = completedBookingsCount;

    let creditsToAward = 0;
    let statusChanged = false;

    // First booking reward: 10 credits
    if (
      completedBookingsCount === 1 &&
      !referralRecord.firstBookingCreditAwarded
    ) {
      creditsToAward += 10;
      referralRecord.firstBookingCreditAwarded = true;
      referralRecord.creditsEarned += 10;
      statusChanged = true;

      console.log(
        `Referral: Awarding 10 credits for first booking to referrer ${referralRecord.referrerId}`
      );

      // Notify referrer about earning first booking reward
      await notificationService.createNotification({
        recipientId: referralRecord.referrerId,
        type: NotificationType.REFERRAL_REWARD_EARNED,
        title: "Referral Reward Earned!",
        message: `You earned 10 credits! Your referral ${referralRecord.refereeName} completed their first booking.`,
        data: {
          creditsEarned: 10,
          refereeId: customerId,
          refereeName: referralRecord.refereeName,
          rewardType: "first_booking",
        },
      });
    }

    // Third booking bonus: Additional 5 credits
    if (
      completedBookingsCount >= 3 &&
      !referralRecord.bonusTierCreditAwarded &&
      referralRecord.firstBookingCreditAwarded
    ) {
      creditsToAward += 5;
      referralRecord.bonusTierCreditAwarded = true;
      referralRecord.creditsEarned += 5;

      console.log(
        `Referral: Awarding 5 bonus credits for 3rd booking to referrer ${referralRecord.referrerId}`
      );

      // Notify referrer about earning bonus tier reward
      await notificationService.createNotification({
        recipientId: referralRecord.referrerId,
        type: NotificationType.REFERRAL_REWARD_EARNED,
        title: "Bonus Referral Reward!",
        message: `You earned an additional 5 credits! Your referral ${referralRecord.refereeName} completed their 3rd booking.`,
        data: {
          creditsEarned: 5,
          refereeId: customerId,
          refereeName: referralRecord.refereeName,
          rewardType: "bonus_tier",
        },
      });
    }

    // If both rewards are awarded, mark referral as COMPLETED
    if (
      referralRecord.firstBookingCreditAwarded &&
      referralRecord.bonusTierCreditAwarded
    ) {
      referralRecord.status = ReferralStatus.COMPLETED;
    }

    // Save referral record updates
    await referralRecord.save({ session: session || undefined });

    // Award credits to referrer if any
    if (creditsToAward > 0) {
      await User.findByIdAndUpdate(
        referralRecord.referrerId,
        { $inc: { credits: creditsToAward } },
        { session: session || undefined }
      );

      console.log(
        `Referral: Successfully awarded ${creditsToAward} credits to user ${referralRecord.referrerId}`
      );
    }
  } catch (error) {
    console.error("Error processing referral rewards:", error);
    // Don't throw error - referral processing shouldn't block booking completion
  }
};

/**
 * Get referral progress for a user (how many bookings until next reward)
 */
export const getReferralProgress = async (userId: string) => {
  try {
    const referralRecord = await Referral.findOne({
      refereeId: userId,
    });

    if (!referralRecord) {
      return null;
    }

    const completedBookings = referralRecord.completedBookingsCount;
    const firstBookingRewardEarned = referralRecord.firstBookingCreditAwarded;
    const bonusTierRewardEarned = referralRecord.bonusTierCreditAwarded;

    let nextRewardAt: number | null = null;
    let nextRewardAmount: number | null = null;

    if (!firstBookingRewardEarned) {
      nextRewardAt = 1;
      nextRewardAmount = 10;
    } else if (!bonusTierRewardEarned) {
      nextRewardAt = 3;
      nextRewardAmount = 5;
    }

    return {
      hasReferrer: true,
      completedBookings,
      firstBookingRewardEarned,
      bonusTierRewardEarned,
      nextRewardAt,
      nextRewardAmount,
    };
  } catch (error) {
    console.error("Error getting referral progress:", error);
    return null;
  }
};
