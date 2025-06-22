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

export async function acceptFriendRequest(req, res) {
    try{
        const {id: requestId} = req.params;
        const friendRequest = await FriendRequest.findById(requestId)
        if(!friendRequest) {
            return res.status(404).json({message: "Friend request not found"});
        }
        //verify that the current user is the recipient of the request
        if(friendRequest.recipient.toString() !== req.user.id) {
            return res.status(403).json({message: "You are not authorized to accept this friend request"});
        }

        //update the friend request status to accepted
        friendRequest.status = "accepted";
        await friendRequest.save();

        //add both users to each other's friends list
        await User.findByIdAndUpdate(friendRequest.sender, {
            $addToSet: { friends: friendRequest.recipient }
        });
        await User.findByIdAndUpdate(friendRequest.recipient, {
            $addToSet: { friends: friendRequest.sender }
        });
        res.status(200).json({message: "Friend request accepted successfully"});
    }catch(error){
        console.error("Error in acceptFriendRequest:", error);
        res.status(500).json({message: "Internal server error"});
    }
}

export async function getFriendRequests(req, res) {
    try{
        const incomingReqs = await FriendRequest.find({recipient: req.user.id, status: "pending"})
            .populate('sender', 'fullName profilePic nativeLanguage learningLanguage');
        const acceptedReqs = await FriendRequest.find({sender: req.user.id, status: "accepted"})
            .populate('recipient', 'fullName profilePic');

        res.status(200).json({
            incomingRequests: incomingReqs,
            acceptedRequests: acceptedReqs
        });

    }catch(error){
        console.error("Error in getFirendRequests:", error);
        res.status(500).json({message: "Internal server error"});
    }
}

export async function getOutgoingFriendRequests(req, res) {
    try{
        const outgoingRequests = await FriendRequest.find({sender: req.user.id, status: "pending"})
            .populate('recipient', 'fullName profilePic nativeLanguage learningLanguage');
        res.status(200).json(outgoingRequests);
    }catch(error){
        console.error("Error in getOutgoingFriendRequests:", error);
        res.status(500).json({message: "Internal server error"});
    }
}