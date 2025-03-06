describe('CRUD de Productos (Vendedor)', () => {
    const vendorEmail = 'pepe@gmail.com'; // Ajusta a un usuario que exista
    const vendorPassword = '123456';            // Contraseña real del vendedor
    
    // Datos del nuevo producto
    const newProductName = `TestProduct_${Date.now()}`;
    const newProductPrice = '123.45';
    const newProductStock = '50';
    
    // Datos editados
    const editedProductName = `Edited_${newProductName}`;
    const editedProductPrice = '999.99';
  
    it('Login como Vendedor', () => {
      // 1) Visitar login
      cy.visit('/login');
  
      // 2) Llenar credenciales
      cy.get('input[name="email"]').type(vendorEmail);
      cy.get('input[name="password"]').type(vendorPassword);
      cy.get('button[type="submit"]').click();
  
      // 3) Verificar que nos lleve a "/"
      cy.url().should('eq', `${Cypress.config('baseUrl')}/`);
    });
  
    it('Navegar a /admin/products', () => {
      // Asumiendo que en la Home (o en la Navbar) hay un link “Registrar Producto”
      // para Vendedor; si no, usa cy.visit('/admin/products') directo.
      cy.contains('Registrar Producto').click();
  
      cy.url().should('include', '/admin/products');
      cy.contains('Administrar Productos').should('be.visible');
    });
  
    it('Agregar un producto', () => {
      // 1) Click en “Agregar Producto”
      cy.contains('Agregar Producto').click();
  
      // 2) Llenar el form
      cy.get('input[name="nombre"]').type(newProductName);
      cy.get('textarea[name="descripcion"]').type('Este es un producto de prueba');
      cy.get('input[name="precio"]').clear().type(newProductPrice);
      cy.get('input[name="categoria"]').type('Categoría Test');
      cy.get('input[name="stock"]').clear().type(newProductStock);
      cy.get('input[name="imagenes"]').type('https://via.placeholder.com/150');
  
      // 3) Enviar
      cy.contains('Agregar Producto').click();
  
      // 4) Verificar que se haya agregado en la lista
      cy.contains(newProductName).should('be.visible');
      cy.contains(`Precio: $${newProductPrice}`).should('exist');
    });
  
    it('Editar el producto recién agregado', () => {
      // 1) Buscar la tarjeta del producto
      //    Suponiendo que aparece un icono <FaEdit> o algo que llame "edit"
      cy.contains(newProductName)
        .parents('.product-card')        // subir al contenedor
        .find('.icon.edit')              // buscar el icono de edición
        .click();
  
      // 2) Cambiar nombre, precio y tal vez otras cosas
      cy.get('input[name="nombre"]').clear().type(editedProductName);
      cy.get('input[name="precio"]').clear().type(editedProductPrice);
  
      // 3) Guardar
      cy.contains('Actualizar Producto').click();
  
      // 4) Verificar en la lista
      cy.contains(editedProductName).should('be.visible');
      cy.contains(`Precio: $${editedProductPrice}`).should('exist');
    });
  
    it('Eliminar el producto editado', () => {
      // 1) Buscar la tarjeta
      cy.contains(editedProductName)
        .parents('.product-card')
        .find('.icon.delete')
        .click();
  
      // 2) Confirmar en el modal
      cy.contains('Confirmar Eliminación').should('be.visible');
      cy.contains('Eliminar').click();
  
      // 3) Verificar que ya no exista en la lista
      cy.contains(editedProductName).should('not.exist');
    });
  });
  