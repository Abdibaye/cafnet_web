import { api } from "./client";
import type {
  Reservation,
  CreateReservationInput,
  ReservationFilterParams,
} from "./types";

/**
 * Creates a new reservation request for the authenticated customer.
 * Sends business_id, party_size, reservation_date (YYYY-MM-DD), reservation_time (HH:MM or HH:MM:SS),
 * and optional special_request, customer_name, customer_phone.
 * Returns the created Reservation with initial status "PENDING".
 */
export async function createReservation(
  input: CreateReservationInput,
): Promise<Reservation> {
  const payload = {
    business_id: input.business_id,
    party_size: input.party_size,
    reservation_date: input.reservation_date,
    reservation_time: input.reservation_time,
    customer_name: input.customer_name,
    customer_phone: input.customer_phone,
    special_request: input.special_request ?? input.special_requests ?? "",
  };

  const res = await api.post<Reservation>("/api/v1/reservations", payload);
  return res.data;
}

/**
 * Lists reservations belonging to the authenticated customer.
 */
export async function listCustomerReservations(
  params?: { limit?: number; offset?: number },
): Promise<Reservation[]> {
  const res = await api.get<Reservation[]>("/api/v1/reservations", { params });
  return res.data || [];
}

/**
 * Retrieves a single reservation for the authenticated customer by UUID.
 */
export async function getCustomerReservation(
  id: string,
): Promise<Reservation> {
  const res = await api.get<Reservation>(`/api/v1/reservations/${id}`);
  return res.data;
}

/**
 * Cancels a pending or confirmed reservation for the authenticated customer.
 */
export async function cancelReservation(
  id: string,
): Promise<{ cancelled: boolean }> {
  const res = await api.post<{ cancelled: boolean }>(
    `/api/v1/reservations/${id}/cancel`,
  );
  return res.data;
}

/**
 * Lists reservations for a business (manager authorized endpoint).
 */
export async function listBusinessReservations(
  businessId: number,
  params?: ReservationFilterParams,
): Promise<Reservation[]> {
  const res = await api.get<Reservation[]>(
    `/api/v1/businesses/${businessId}/reservations`,
    { params },
  );
  return res.data || [];
}

/**
 * Confirms a pending reservation (manager authorized endpoint).
 */
export async function confirmReservation(
  businessId: number,
  resId: string,
): Promise<{ confirmed: boolean }> {
  const res = await api.post<{ confirmed: boolean }>(
    `/api/v1/businesses/${businessId}/reservations/${resId}/confirm`,
  );
  return res.data;
}

/**
 * Declines a pending reservation with a reason (manager authorized endpoint).
 */
export async function declineReservation(
  businessId: number,
  resId: string,
  reason: string,
): Promise<{ declined: boolean }> {
  const res = await api.post<{ declined: boolean }>(
    `/api/v1/businesses/${businessId}/reservations/${resId}/decline`,
    { reason },
  );
  return res.data;
}

/**
 * Marks a confirmed reservation as completed, unlocking verified reviews (manager authorized endpoint).
 */
export async function completeReservation(
  businessId: number,
  resId: string,
): Promise<{ completed: boolean }> {
  const res = await api.post<{ completed: boolean }>(
    `/api/v1/businesses/${businessId}/reservations/${resId}/complete`,
  );
  return res.data;
}
