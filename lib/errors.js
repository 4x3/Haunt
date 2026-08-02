// Thrown when the failure is the user's to act on, so the message is safe to
// show them verbatim. Anything else is logged and reported generically.
export class UserError extends Error {}
