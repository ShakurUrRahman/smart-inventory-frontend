"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Notification {
	id: string;
	description: string;
	entityType: string;
	createdAt: string;
	isRead: boolean;
}

interface NotificationStore {
	notifications: Notification[];
	unreadCount: number;
	lastActivityId: string | null;
	readIds: string[]; // ← track read IDs persistently
	addNotification: (notification: Notification) => void;
	markAsRead: (id: string) => void;
	markAllAsRead: () => void;
	removeNotification: (id: string) => void;
	setActivities: (activities: any[]) => void;
}

export const useNotificationStore = create<NotificationStore>()(
	persist(
		(set, get) => ({
			notifications: [],
			unreadCount: 0,
			lastActivityId: null,
			readIds: [], // ← persisted list of read notification IDs

			addNotification: (notification: Notification) =>
				set((state) => {
					const updated = [
						notification,
						...state.notifications,
					].slice(0, 5);
					return {
						notifications: updated,
						unreadCount: updated.filter((n) => !n.isRead).length,
					};
				}),

			markAsRead: (id: string) =>
				set((state) => {
					const updated = state.notifications.filter(
						(n) => n.id !== id,
					);
					return {
						notifications: updated,
						unreadCount: updated.filter((n) => !n.isRead).length,
						readIds: [...state.readIds, id], // ← save to readIds
					};
				}),

			markAllAsRead: () =>
				set((state) => ({
					notifications: [],
					unreadCount: 0,
					readIds: [
						...state.readIds,
						...state.notifications.map((n) => n.id), // ← save all as read
					],
				})),

			removeNotification: (id: string) =>
				set((state) => {
					const updated = state.notifications.filter(
						(n) => n.id !== id,
					);
					return {
						notifications: updated,
						unreadCount: updated.filter((n) => !n.isRead).length,
						readIds: [...state.readIds, id],
					};
				}),

			setActivities: (activities: any[]) =>
				set((state) => {
					// ← use state parameter directly
					if (!activities || activities.length === 0) return state;

					const lastId = state.lastActivityId; // ← use state instead of get()

					let newActivities = activities;
					if (lastId) {
						const lastIndex = activities.findIndex(
							(a) => a._id === lastId,
						);
						if (lastIndex !== -1) {
							newActivities = activities.slice(0, lastIndex);
						}
					}

					const newLastId = activities[0]?._id || null;

					const newNotifications = newActivities
						.slice(0, 5)
						.map((activity) => ({
							id: activity._id,
							description:
								activity.description || activity.action,
							entityType: activity.entityType,
							createdAt: activity.createdAt,
							isRead: state.readIds.includes(activity._id), // ← use state
						}));

					const updated = [
						...newNotifications,
						...state.notifications.filter(
							// ← use state
							(n) =>
								!newNotifications.find((nn) => nn.id === n.id),
						),
					].slice(0, 5);

					return {
						notifications: updated,
						unreadCount: updated.filter((n) => !n.isRead).length,
						lastActivityId: newLastId,
					};
				}),
		}),
		{
			name: "notification-store",
			partialize: (state) => ({
				readIds: state.readIds, // ← persist read IDs
				lastActivityId: state.lastActivityId, // ← persist last seen ID
			}),
		},
	),
);
