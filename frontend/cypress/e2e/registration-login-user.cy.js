describe('Flujo de Registro, Login y Logout (Cliente)', () => {
    const randomEmail = `testuser_${Date.now()}@example.com`;
    const password = '123456';
    const userName = 'Test User';
  
    it('Registro de un nuevo usuario (Cliente)', () => {
      cy.visit('/registro');
  
      // Llenar el formulario de registro
      cy.get('input[name="nombre"]').type(userName);
      cy.get('input[name="email"]').type(randomEmail);
      cy.get('input[name="password"]').type(password);
      cy.get('select[name="rol"]').select('Cliente');
  
      // Enviar el formulario
      cy.get('button[type="submit"]').click();
  
      // Verificar que nos lleve a /login
      cy.url().should('include', '/login');
    });
  
    it('Iniciar sesión con el usuario recién registrado (Cliente)', () => {
      cy.visit('/login');
  
      cy.get('input[name="email"]').type(randomEmail);
      cy.get('input[name="password"]').type(password);
      cy.get('button[type="submit"]').click();
  
      // Verificar que nos lleve a la Home
      cy.url().should('eq', `${Cypress.config('baseUrl')}/`);
    });

  });
  