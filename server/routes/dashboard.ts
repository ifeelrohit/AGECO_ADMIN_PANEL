import { Router, Response } from 'express';
import { agecoStore } from '../data/store.ts';
import { authenticateToken, authorizeRoles, AuthenticatedRequest } from '../middleware/auth.ts';

const router = Router();

// Locked role matrix: Admin dashboard accessible by all 5 roles
const dashboardAuth = [
  authenticateToken,
  authorizeRoles('SUPER_ADMIN', 'ADMIN', 'EDITOR', 'SALES', 'CONTENT_MANAGER'),
];

router.get('/stats', ...dashboardAuth, (req: AuthenticatedRequest, res: Response) => {
  const totalProducts = agecoStore.products.length;
  const publishedProducts = agecoStore.products.filter((p) => p.status === 'PUBLISHED').length;
  const totalBrands = agecoStore.brands.length;
  const totalEnquiries = agecoStore.enquiries.length;
  const newEnquiries = agecoStore.enquiries.filter((e) => e.status === 'NEW').length;
  const quotedEnquiries = agecoStore.enquiries.filter((e) => e.status === 'QUOTED').length;
  const activeSolutions = agecoStore.solutions.length;
  const totalProjects = agecoStore.projects.length;
  const totalUsers = agecoStore.users.length;
  const recentAuditLogs = agecoStore.auditLogs.slice(0, 8);

  // Category distribution
  const categoryStats = agecoStore.categories.map((c) => ({
    name: c.name,
    count: agecoStore.products.filter((p) => p.categoryId === c.id).length,
  }));

  // Enquiry status distribution
  const enquiryStatusMap = {
    NEW: agecoStore.enquiries.filter((e) => e.status === 'NEW').length,
    IN_REVIEW: agecoStore.enquiries.filter((e) => e.status === 'IN_REVIEW').length,
    QUOTED: agecoStore.enquiries.filter((e) => e.status === 'QUOTED').length,
    CLOSED: agecoStore.enquiries.filter((e) => e.status === 'CLOSED').length,
  };

  res.json({
    success: true,
    data: {
      metrics: {
        totalProducts,
        publishedProducts,
        totalBrands,
        totalEnquiries,
        newEnquiries,
        quotedEnquiries,
        activeSolutions,
        totalProjects,
        totalUsers,
        systemHealth: 'HEALTHY',
        databaseCacheRatio: '99.4%',
      },
      categoryStats,
      enquiryStatusMap,
      recentAuditLogs,
      currentUserRole: req.user?.role,
    },
  });
});

export default router;
