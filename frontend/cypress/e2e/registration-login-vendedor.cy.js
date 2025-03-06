describe('Flujo de Registro, Login y Logout (Vendedor)', () => {
    const vendorEmail = `testvendor_${Date.now()}@example.com`;
    const vendorPassword = '654321';
    const vendorName = 'Test Vendor';
  
    it('Registro de un nuevo usuario (Vendedor)', () => {
      cy.visit('/registro');
  
      cy.get('input[name="nombre"]').type(vendorName);
      cy.get('input[name="email"]').type(vendorEmail);
      cy.get('input[name="password"]').type(vendorPassword);
      cy.get('select[name="rol"]').select('Vendedor');
  
      cy.get('button[type="submit"]').click();
  
      // Después de registrarse, se navega a /login
      cy.url().should('include', '/login');
    });
  
    it('Iniciar sesión con el usuario recién registrado (Vendedor)', () => {
      // Asumimos que estamos en /login
      cy.visit('/login');
  
      cy.get('input[name="email"]').type(vendorEmail);
      cy.get('input[name="password"]').type(vendorPassword);
      cy.get('button[type="submit"]').click();
  
      // Verificamos que nos lleva a "/"
      cy.url().should('eq', `${Cypress.config('baseUrl')}/`);
    });
  });
  