import { doc, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase"; // adjust path to your firebase init
import { normalizeText } from "../utils/text"; // adjust if normalizeText lives elsewhere

/**
 * Save access assignment for a user
 * @param {string} email - User email
 * @param {string} role - User role
 * @param {object} extraData - Additional fields to persist
 */
export async function saveAccessAssignment(email, role, extraData = {}) {
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedRole = normalizeText(role);
  const normalizedStatus = String(extraData.status || "active").trim().toLowerCase();

  const personnelRoles = [
    "mechanics personnel",
    "inventory personnel",
    "cashier personnel",
    "front desk personnel",
  ];
  const isPersonnelRole = personnelRoles.includes(normalizedRole);
  const isAdminRole = ["admin", "superadmin"].includes(normalizedRole);
  const isActive = normalizedStatus !== "inactive" && normalizedRole !== "customer";

  const dashboardPath =
    normalizedRole === "superadmin"
      ? "/superadmin"
      : normalizedRole === "admin"
      ? "/admin"
      : isPersonnelRole || normalizedRole === "staff"
      ? "/staff"
      : null;

  const collectionName = isAdminRole ? "authorizedAdmin" : "authorizedPersonnel";
  const alternateCollection = isAdminRole ? "authorizedPersonnel" : "authorizedAdmin";
  const accessLevel =
    normalizedRole === "superadmin" || normalizedRole === "admin" ? normalizedRole : "staff";

  const writeOperations = [
    setDoc(
      doc(db, collectionName, normalizedEmail),
      {
        email: normalizedEmail,
        fullName: extraData.fullName?.trim() || "",
        role: normalizedRole,
        personnelRole: isPersonnelRole ? normalizedRole : "",
        accessLevel,
        status: isActive ? "active" : "inactive",
        active: isActive,
        temporaryPassword: extraData.temporaryPassword?.trim() || "",
        mustChangePassword: Boolean(extraData.mustChangePassword),
        firstLoginRequired: Boolean(extraData.firstLoginRequired),
        dashboardPath,
        invitedBy: extraData.invitedBy || "",
        accessibleSections: extraData.accessibleSections || [], // ✅ persist menu access
        updatedAt: serverTimestamp(),
        createdAt: extraData.createdAt || serverTimestamp(),
      },
      { merge: true }
    ),
  ];

  // If superadmin, clean up alternate collection
  if (extraData.currentAccessRole === "superadmin") {
    writeOperations.push(deleteDoc(doc(db, alternateCollection, normalizedEmail)));
  }

  await Promise.all(writeOperations);
}