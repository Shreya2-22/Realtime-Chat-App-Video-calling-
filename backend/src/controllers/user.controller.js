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