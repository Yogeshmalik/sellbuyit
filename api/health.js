export default function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({
      success: false,
      error: {
        code: "METHOD_NOT_ALLOWED",
        message: "This action is not available for this request.",
      },
    });
  }

  return res.status(200).json({
    success: true,
    data: { status: "ok" },
  });
}
