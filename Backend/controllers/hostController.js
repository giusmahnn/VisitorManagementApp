const User = require("../models/User");

const publicHost = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
});

const getHosts = async (req, res) => {
  try {
    const hosts = await User.find({ role: "host" }).select("-password");

    return res.status(200).json({
      success: true,
      message: "Hosts retrieved successfully",
      data: hosts.map(publicHost),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unable to retrieve hosts",
      data: null,
    });
  }
};

const getHostById = async (req, res) => {
  try {
    const host = await User.findOne({
      _id: req.params.id,
      role: "host",
    }).select("-password");

    if (!host) {
      return res.status(404).json({
        success: false,
        message: "Host not found",
        data: null,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Host retrieved successfully",
      data: publicHost(host),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unable to retrieve host",
      data: null,
    });
  }
};

module.exports = { getHosts, getHostById };
