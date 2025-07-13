import userModel from "../models/userModel.js";

export const registerController = async (req, res, next) => {
    const { name, email, password } = req.body;
    // validate 
    if (!email) {
        return next("email is required");
    }
    if (!password) {
        return next("password is required and greater than 6 character");
    }

    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
        return next("Email already register please login");
    }

    const user = await userModel.create({ name, email, password });

    //token
    const token = user.createJWT();
    res.status(201).send({
        success: true,
        message: "User created successfully",
        user: {
            name: user.name,
            lastName: user.lastName,
            email: user.email,
            location: user.location,
        },

        token
    });
};


export const loginController = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            return next('Please provide all fields');
        }

        // Find user by email
        const user = await userModel.findOne({ email }).select("+password")
        if (!user) {
            return next('Invalid username or password');
        }

        // Compare password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return next('Invalid username or password');
        }

        user.password = undefined;

        const token = user.createJWT();
        res.status(200).json({
            success: true,
            message: "Login successfully",
            user,
            token,
        });
    } catch (error) {
        next(error);
    }
};

