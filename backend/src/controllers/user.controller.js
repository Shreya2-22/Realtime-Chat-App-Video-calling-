import FriendRequest from "../models/FriendRequest.js";

export async function getRecommendedUsers(req, res) {
    try{
        const currentUserId = req.user.id;
        const currentUser = req.user;

        const recommendedUsers = await User.find({
            $and: [
                {_id: { $ne: currentUserId } }, // Exclude current user
                { isOnboarded: true }, // Only include onboarded users
                {$id: { $nin: currentUser.friends } } // Exclude friends
            ],
        });
        res.status(200).json(recommendedUsers);
    }catch(error){
        console.error("Error in getRecommendedUsers:", error);
        res.status(500).json({message: "Internal server error"});
    }
}

export async function getMyFriends(req, res) {
    try{
        const user = await User.findById(req.user.id)
            .select('friends')
            .populate('friends', 'fullName profilePic nativeLanguage learningLanguage');
        res
    }catch(error){
        console.error("Error in getMyFriends:", error);
        res.status(500).json({message: "Internal server error"});
    }
}

export async function sendFriendRequest(req, res) {
    try{
        const myId = req.user.id;
        const {id: recipientId} = req.params;
        //prevent sending friend request to self
        if(myId === recipientId) {
            return res.status(400).json({message: "You cannot send a friend request to yourself"});
        }

        const recipient = await User.findById(recipientId);
        if(!recipient) {
            return res.status(404).json({message: "Recipient not found"});
        }

        //check is user is already friends with recipient
        if(recipient.friends.includes(myId)) {
            return res.status(400).json({message: "You are already friends with this user"});
        }

        //check is request already exists
        const existingRequest = await FriendRequest.findOne({
            $or: [
                { sender: myId, recipient: recipientId },
                { sender: recipientId, recipient: myId }
            ],
        });
        if(existingRequest) {
            return res.status(400).json({message: "Friend request already exists between you and this user"});
        }

        //create new friend request
        const friendRequest = await FriendRequest.create({
            sender: myId,
            recipient: recipientId,
        });
        res.status(201).json(friendRequest);
        
    }catch(error){
        console.error("Error in sendFriendRequest:", error);
        res.status(500).json({message: "Internal server error"});
    }
}