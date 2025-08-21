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
    // Automatically set permissions for chat-message for Student and Teacher roles
    try {
      const roles = ['Student', 'Teacher'];
      
      for (const roleName of roles) {
        const role = await strapi.query('plugin::users-permissions.role').findOne({
          where: { name: roleName },
        });

        if (role) {
          // Find all permissions for this role that contain 'chat-message'
          const permissions = await strapi.query('plugin::users-permissions.permission').findMany({
            where: {
              role: role.id,
            },
          });

          // Enable all chat-message related permissions
          for (const permission of permissions) {
            if (permission.action && permission.action.includes('chat-message')) {
              await strapi.query('plugin::users-permissions.permission').update({
                where: { id: permission.id },
                data: { enabled: true },
              });
            }
          }

          console.log(`✅ Chat permissions automatically enabled for ${roleName} role`);
        }
      }
    } catch (error) {
      console.log('⚠️ Could not automatically set chat permissions:', error.message);
    }
  },
};
