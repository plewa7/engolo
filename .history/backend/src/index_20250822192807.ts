// import type { Core } from '@strapi/strapi';

export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register(/* { strapi }: { strapi: Core.Strapi } */) {},

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  async bootstrap({ strapi }: { strapi: any }) {
    // Automatically set permissions for various models for Student and Teacher roles
    try {
      const roles = ['Public', 'Student', 'Teacher'];
      const modelsToEnable = ['chat-message', 'user-progress', 'exercise-statistic', 'quiz-statistic', 'quiz', 'quiz-set'];
      
      for (const roleName of roles) {
        const role = await strapi.query('plugin::users-permissions.role').findOne({
          where: { name: roleName },
        });

        if (role) {
          // Find all permissions for this role
          const permissions = await strapi.query('plugin::users-permissions.permission').findMany({
            where: {
              role: role.id,
            },
          });

          // Enable permissions for specified models
          for (const permission of permissions) {
            if (permission.action) {
              for (const model of modelsToEnable) {
                if (permission.action.includes(model)) {
                  await strapi.query('plugin::users-permissions.permission').update({
                    where: { id: permission.id },
                    data: { enabled: true },
                  });
                  console.log(`✅ Enabled ${permission.action} for ${roleName}`);
                }
              }
            }
          }

          console.log(`✅ Permissions automatically enabled for ${roleName} role`);
        }
      }
    } catch (error) {
      console.log('⚠️ Could not automatically set permissions:', error.message);
    }
  },
};
