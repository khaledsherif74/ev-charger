import { useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  adminSessionExpired,
  bootstrapAdmin,
} from "../features/adminAuth/adminAuthSlice";
import { useI18n } from "../i18n";
import Spinner from "../components/common/Spinner";

export default function AdminRoute() {
  const dispatch = useDispatch();
  const location = useLocation();
  const { t } = useI18n();
  const { admin, initialized } = useSelector((state) => state.adminAuth);

  useEffect(() => {
    if (!initialized) dispatch(bootstrapAdmin());
  }, [dispatch, initialized]);

  useEffect(() => {
    const onExpired = () => dispatch(adminSessionExpired());
    window.addEventListener("admin:unauthorized", onExpired);
    return () => window.removeEventListener("admin:unauthorized", onExpired);
  }, [dispatch]);

  if (!initialized)
    return (
      <div className="full-page-center">
        <Spinner label={t("auth.checking")} />
      </div>
    );
  if (!admin)
    return (
      <Navigate to="/admin/login" replace state={{ from: location.pathname }} />
    );
  return <Outlet />;
}
