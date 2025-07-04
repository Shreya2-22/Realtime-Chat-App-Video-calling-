import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import { upsertStreamUser } from '../lib/stream.js';

export async function signup(req, res) {
    const {fullName, email, password} = req.body;
    try{
        if(!email || !password || !fullName){
            return res.status(400).json({message: "Please fill all the fields"});
        }

        if(password.length<6){
            return res.status(400).json({message: "Password must be at least 6 characters long"});
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if(!emailRegex.test(email)){
            return res.status(400).json({message: "Please enter a valid email address"});
        }

        const existingUser = await User.findOne({email});
        if(existingUser){
            return res.status(400).json({message: "User with this email already exists"});
        }

        const idx = Math.floor(Math.random() * 100)+1; //generate a random number between 1 and 100
        const randomAvatar = `https://avatar-placeholder.iran.liara.run/public/${idx}.png`; //use the random number to get a random avatar
        
        const newUser = await User.create({
            fullName,
            email,
            password,
            profilePic: randomAvatar,
        });
        
        try{
            await upsertStreamUser({
            id: newUser._id.toString(),
            name: newUser.fullName,
            image: newUser.profilePic || "",
            });
            console.log(`Stream user upserted for ${newUser.fullName}`);
        }catch(error){
            console.error("Error in upserting Stream user:", error);
        }

        const token = jwt.sign({userId: newUser._id,},
             process.env.JWT_SECRET_KEY, 
             {expiresIn: '7d'});

        res.cookie('jwt', token, {
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            httpOnly: true,
            sameSite: 'strict',
            secure: process.env.NODE_ENV === 'production', // Set to true in production
        });

        res.status(201).json({success: true, user: newUser});
    }catch(error){
        console.error("Error in signup:", error);
        res.status(500).json({message: "Internal server error"});
    }
}

export async function login(req, res) {
    try{
        const {email, password} = req.body;
        if(!email || !password){
            return res.status(400).json({message: "Please fill all the fields"});
        }
        const user = await User.findOne({email});
        if(!user){
            return res.status(401).json({message: "Invalid email or password"});
        }
        const isPasswordCorrect = await user.matchPassword(password);
        if(!isPasswordCorrect){
            return res.status(401).json({message: "Invalid email or password"});
        }
        const token = jwt.sign({userId: user._id}, process.env.JWT_SECRET_KEY,
             {expiresIn: '7d'});
        res.cookie('jwt', token, {
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            httpOnly: true,
            sameSite: 'strict',
            secure: process.env.NODE_ENV === 'production', // Set to true in production
        });

        res.status(200).json({success: true, user});

    }catch(error){  
        console.error("Error in login:", error);
        res.status(500).json({message: "Internal server error"});
    }
}

export function logout(req, res) {
    res.clearCookie('jwt');
    res.status(200).json({success:true, message: "Logged out successfully"});
}

export async function onboard(req, res){
    try{
        const userId = req.user._id;
        const {fullName, bio, nativeLanguage, learningLanguage, location} = req.body;
        if(!fullName || !bio || !nativeLanguage || !learningLanguage || !location){
            return res.status(400).json({
                message: "Please fill all the fields",
                missingFields: [
                    !fullName && "fullName",
                    !bio && "bio",
                    !nativeLanguage && "nativeLanguage",
                    !learningLanguage && "learningLanguage",
                    !location && "location",
                ].filter(Boolean)
            });
        }
        const updatedUser = await User.findByIdAndUpdate(userId, {
            ...req.body,
            isOnboarded: true
        }, {new:true});
        if(!updatedUser){
            return res.status(404).json({message: "User not found"});
        }
        try{
            await upsertStreamUser({
                id: updatedUser._id.toString(),
                name: updatedUser.fullName,
                image: updatedUser.profilePic || "",
            });
            console.log(`Stream user upserted for ${updatedUser.fullName}`);
            res.status(200).json({success: true, user: updatedUser});
        }catch(error){
            console.error("Error in Stream user upsert:", error);
            return res.status(500).json({message: "Error updating Stream user"});
        }
    }catch(error){
        console.error("Error in onboarding:", error);
        return res.status(500).json({message: "Internal server error"});
    }
}