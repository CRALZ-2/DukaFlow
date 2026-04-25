'use strict';
const catchAsync = require('../utils/catchAsync');
const apiResponse = require('../utils/apiResponse');
const employeeService = require('../services/employee.service');

module.exports = {
  // POST /api/v1/shops/:shopId/employees/invite
  invite: catchAsync(async (req, res) => {
    const result = await employeeService.invite(
      req.shop.id,
      req.user.id,
      req.body
    );
    return apiResponse.success(res, result.message, result, null, 201);
  }),

  // GET /api/v1/shops/:shopId/employees
  list: catchAsync(async (req, res) => {
    const employees = await employeeService.listEmployees(req.shop.id);
    return apiResponse.success(res, 'Employees retrieved', employees);
  }),

  // PATCH /api/v1/shops/:shopId/employees/:employeeId/role
  updateRole: catchAsync(async (req, res) => {
    const updated = await employeeService.updateRole(
      req.shop.id,
      req.params.employeeId,
      req.body.role,
      req.user.id
    );
    return apiResponse.success(res, 'Employee role updated', updated);
  }),

  // DELETE /api/v1/shops/:shopId/employees/:employeeId
  deactivate: catchAsync(async (req, res) => {
    const result = await employeeService.deactivate(
      req.shop.id,
      req.params.employeeId,
      req.user.id
    );
    return apiResponse.success(res, result.message);
  }),

  // POST /api/v1/employees/accept-invite — public, no shop context needed
  acceptInvite: catchAsync(async (req, res) => {
    const { token, password } = req.body;
    const result = await employeeService.acceptInvite(token, password);
    return apiResponse.success(res, result.message);
  }),
};
