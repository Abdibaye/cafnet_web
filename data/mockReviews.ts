export type MockReview = {
  id: string;
  businessId: number;
  userId: string;
  userName: string;
  userAvatar: string;
  rating: number;
  text: string;
  date: string;
  helpfulCount: number;
  verifiedVisit?: boolean;
};

export const mockReviews: MockReview[] = [
  { id: "review-001", businessId: 1, userId: "customer-001", userName: "Sara M.", userAvatar: "S", rating: 5, text: "The food was really good, especially the tibs. The cultural show made the evening feel special, though service slowed down when the room filled up.", date: "2 weeks ago", helpfulCount: 18, verifiedVisit: true },
  { id: "review-002", businessId: 1, userId: "customer-002", userName: "Mekdes T.", userAvatar: "M", rating: 4, text: "A memorable place for visitors who want traditional food and music. The injera and shiro were excellent; book a little time for the full experience.", date: "1 month ago", helpfulCount: 11 },
  { id: "review-003", businessId: 1, userId: "customer-003", userName: "Dawit K.", userAvatar: "D", rating: 5, text: "Generous portions and a lively atmosphere. We brought family from out of town and everyone found something they enjoyed.", date: "2 months ago", helpfulCount: 9, verifiedVisit: true },
  { id: "review-004", businessId: 2, userId: "customer-004", userName: "Hana G.", userAvatar: "H", rating: 5, text: "Excellent coffee and a calm place to get some work done. The Guji pour-over was bright without being too sharp.", date: "1 week ago", helpfulCount: 14, verifiedVisit: true },
  { id: "review-005", businessId: 2, userId: "customer-005", userName: "Liya A.", userAvatar: "L", rating: 4, text: "Lovely pastries and friendly staff. It gets busy around lunch, but the patio is worth waiting for on a sunny day.", date: "3 weeks ago", helpfulCount: 7 },
  { id: "review-006", businessId: 3, userId: "customer-006", userName: "Yonas H.", userAvatar: "Y", rating: 5, text: "The crust is excellent and the patio is lovely in the evening. The mushroom pasta was rich and the portions felt fair for the price.", date: "3 weeks ago", helpfulCount: 12, verifiedVisit: true },
  { id: "review-007", businessId: 3, userId: "customer-007", userName: "Ruth S.", userAvatar: "R", rating: 3, text: "Good pizza, but our table waited a while for drinks. I would come back for the food, especially if I was not in a hurry.", date: "2 months ago", helpfulCount: 5 },
  { id: "review-008", businessId: 4, userId: "customer-008", userName: "Selam T.", userAvatar: "S", rating: 4, text: "Fresh fish and generous portions. A good choice for a family meal, although the dining room was louder than expected.", date: "1 month ago", helpfulCount: 6 },
  { id: "review-009", businessId: 5, userId: "customer-009", userName: "Mekdes G.", userAvatar: "M", rating: 4, text: "The lunch combo is filling and the service is quick. The burger is messy in the best way, but the fries could be hotter.", date: "2 weeks ago", helpfulCount: 8, verifiedVisit: true },
  { id: "review-010", businessId: 6, userId: "customer-010", userName: "Rahel B.", userAvatar: "R", rating: 5, text: "Fresh, fast, and exactly what I wanted on a hot afternoon. The passion fruit cooler is not too sweet.", date: "4 days ago", helpfulCount: 10 },
  { id: "review-011", businessId: 7, userId: "customer-011", userName: "Yonas H.", userAvatar: "Y", rating: 4, text: "A lovely, unhurried place for traditional coffee. The buna ceremony is worth seeing, and the chechebsa made a good breakfast.", date: "2 months ago", helpfulCount: 4 },
];

export function getBusinessReviews(businessId: number) {
  return mockReviews.filter((review) => review.businessId === businessId);
}

export function getReviewSummary(businessId: number) {
  const reviews = getBusinessReviews(businessId);
  if (reviews.length === 0) return { count: 0, average: 0, distribution: [0, 0, 0, 0, 0] };

  const total = reviews.reduce((sum, review) => sum + review.rating, 0);
  const distribution = [5, 4, 3, 2, 1].map((rating) => reviews.filter((review) => review.rating === rating).length);
  return { count: reviews.length, average: Math.round((total / reviews.length) * 10) / 10, distribution };
}
