/** Trial / dev Pro activation without Razorpay — never enabled in production. */
export function trialBypassAllowed(): boolean {
  return process.env.NODE_ENV !== "production" && process.env.CHECKOUT_DEV_BYPASS === "1";
}
