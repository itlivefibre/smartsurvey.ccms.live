<script setup>
const router = useRouter();
router.replace("/dashboard");
definePageMeta({
  layout: "login",
});
</script>

<!-- <script setup>
import { useRouter } from "vue-router";

const router = useRouter();

// Example of navigating to a route with a project_id as a parameter
const navigateToDashboard = (projectId) => {
  router.push({ path: `/dashboard/${projectId}` }); // Using `push` to navigate and pass projectId
};
</script> -->
