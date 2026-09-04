/**
 * Sign a JWT, attach it as an httpOnly cookie and also return it in the
 * JSON body so the SPA can store it in memory / localStorage.
 */
const sendToken = (user, statusCode, res) => {
  const token = user.getSignedJwtToken();

  const cookieExpireDays = parseInt(process.env.JWT_COOKIE_EXPIRE) || 7;

  const cookieOptions = {
    expires:  new Date(Date.now() + cookieExpireDays * 24 * 60 * 60 * 1000),
    httpOnly: true,
    // In production the frontend (Vercel) and backend (Render) are on different
    // domains, so we need sameSite=none + secure=true for cross-site cookies
    secure:   process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  };

  res
    .status(statusCode)
    .cookie('token', token, cookieOptions)
    .json({
      success: true,
      token,
      user: {
        id:         user._id,
        name:       user.name,
        email:      user.email,
        studentId:  user.studentId,
        role:       user.role,
        department: user.department,
        avatar:     user.avatar,
      },
    });
};

module.exports = sendToken;
